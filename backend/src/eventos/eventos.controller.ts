import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';
import { EventosService } from './eventos.service';

@Controller('eventos')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  @Get()
  listarPublicados() {
    return this.service.listarPublicados();
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  crear(@Req() request: AuthenticatedRequest, @Body() datos: CrearEventoDto) {
    return this.service.crear(request.user.sub, datos);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  actualizar(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarEventoDto,
  ) {
    return this.service.actualizar(
      request.user.sub,
      request.user.rol,
      id,
      datos,
    );
  }
}
