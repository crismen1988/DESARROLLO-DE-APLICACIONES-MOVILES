import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TipoCuenta } from '../generated/prisma/enums';
import { Throttle } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { SolicitarRestablecimientoDto } from './dto/solicitar-restablecimiento.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';

class CredencialesDto {
  @IsEmail()
  @MaxLength(180)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  correo!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

class RegistroDto extends CredencialesDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  nombre!: string;

  @IsEnum(TipoCuenta)
  @IsOptional()
  tipoCuenta: TipoCuenta = TipoCuenta.TURISTA;

  @IsString()
  @IsOptional()
  @MaxLength(13)
  ruc?: string;

  @IsString()
  @IsOptional()
  @MaxLength(180)
  razonSocial?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  nombreComercial?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  ciudad?: string;

  @IsString()
  @IsOptional()
  @MaxLength(180)
  actividadTuristica?: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsOptional()
  @MaxLength(2048)
  sitioWeb?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('registro')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  registrar(@Body() body: RegistroDto) {
    return this.service.registrar(
      body.correo,
      body.nombre,
      body.password,
      body.tipoCuenta,
      body.ruc,
      {
        razonSocial: body.razonSocial,
        nombreComercial: body.nombreComercial,
        telefono: body.telefono,
        direccion: body.direccion,
        ciudad: body.ciudad,
        actividadTuristica: body.actividadTuristica,
        sitioWeb: body.sitioWeb,
      },
    );
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  iniciarSesion(@Body() body: CredencialesDto) {
    return this.service.iniciarSesion(body.correo, body.password);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async solicitarRestablecimiento(@Body() body: SolicitarRestablecimientoDto) {
    await this.service.solicitarRestablecimiento(body.correo);
    return {
      message:
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async restablecerPassword(@Body() body: RestablecerPasswordDto) {
    await this.service.restablecerPassword(body.token, body.passwordNueva);
    return { message: 'Contraseña actualizada correctamente' };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  refrescar(@Body() body: RefreshTokenDto) {
    return this.service.refrescar(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async cerrarSesion(@Body() body: RefreshTokenDto): Promise<void> {
    await this.service.cerrarSesion(body.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  perfil(@Req() request: Request & { user: unknown }) {
    return request.user;
  }
}
