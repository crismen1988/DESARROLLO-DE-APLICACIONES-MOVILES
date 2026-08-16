import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

class CredencialesDto {
  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class RegistroDto extends CredencialesDto {
  @IsString()
  @MinLength(2)
  nombre!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('registro')
  registrar(@Body() body: RegistroDto) {
    return this.service.registrar(body.correo, body.nombre, body.password);
  }

  @Post('login')
  iniciarSesion(@Body() body: CredencialesDto) {
    return this.service.iniciarSesion(body.correo, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  perfil(@Req() request: Request & { user: unknown }) {
    // No se hace una segunda consulta: el usuario ya fue validado por el JWT.
    return request.user;
  }
}
