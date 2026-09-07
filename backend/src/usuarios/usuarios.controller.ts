import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { AdministrarUsuarioDto } from './dto/administrar-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { UsuariosService } from './usuarios.service';
import { ActividadPerfilDto } from './dto/actividad-perfil.dto';

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get('perfil')
  perfil(@Req() request: AuthenticatedRequest) {
    return this.service.obtenerPerfil(request.user.sub);
  }

  @Patch('perfil')
  actualizarPerfil(
    @Req() request: AuthenticatedRequest,
    @Body() datos: ActualizarPerfilDto,
  ) {
    return this.service.actualizarPerfil(request.user.sub, datos);
  }

  @Get('perfil/actividad')
  actividad(
    @Req() request: AuthenticatedRequest,
    @Query() query: ActividadPerfilDto,
  ) {
    return this.service.obtenerActividad(request.user.sub, query);
  }

  @Patch('perfil/password')
  cambiarPassword(
    @Req() request: AuthenticatedRequest,
    @Body() datos: CambiarPasswordDto,
  ) {
    return this.service.cambiarPassword(request.user.sub, datos);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  listar() {
    return this.service.listarAdministracion();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  administrar(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: AdministrarUsuarioDto,
  ) {
    return this.service.administrar(request.user.sub, id, datos);
  }
}
