import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ActualizarPuntoInteresDto } from './dto/actualizar-punto-interes.dto';
import { ConsultarPuntosInteresDto } from './dto/consultar-puntos-interes.dto';
import {
  ContactoDto,
  HorarioDto,
  ImagenDto,
} from './dto/catalogo-adicional.dto';
import { CrearPuntoInteresDto } from './dto/crear-punto-interes.dto';
import { PuntosInteresService } from './puntos-interes.service';

@Controller('puntos-interes')
export class PuntosInteresController {
  constructor(private readonly service: PuntosInteresService) {}

  @Get()
  listarOptimizado(@Query() consulta: ConsultarPuntosInteresDto) {
    return this.service.listarOptimizado(consulta);
  }

  @Get('demo/n-plus-one')
  listarConNPlusUno() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.service.listarConNPlusUno();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  crear(
    @Req() request: AuthenticatedRequest,
    @Body() datos: CrearPuntoInteresDto,
  ) {
    return this.service.crear(request.user.sub, datos);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  actualizar(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarPuntoInteresDto,
  ) {
    return this.service.actualizar(
      request.user.sub,
      request.user.rol,
      id,
      datos,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  eliminar(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.eliminar(request.user.sub, request.user.rol, id);
  }

  @Patch(':id/horarios')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  actualizarHorarios(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ParseArrayPipe({ items: HorarioDto })) horarios: HorarioDto[],
  ) {
    return this.service.actualizarHorarios(
      request.user.sub,
      request.user.rol,
      id,
      horarios,
    );
  }

  @Post(':id/imagenes')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  agregarImagen(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() imagen: ImagenDto,
  ) {
    return this.service.agregarImagen(
      request.user.sub,
      request.user.rol,
      id,
      imagen,
    );
  }

  @Patch(':id/contacto')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('PROVEEDOR', 'ADMINISTRADOR')
  actualizarContacto(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() contacto: ContactoDto,
  ) {
    return this.service.actualizarContacto(
      request.user.sub,
      request.user.rol,
      id,
      contacto,
    );
  }
}
