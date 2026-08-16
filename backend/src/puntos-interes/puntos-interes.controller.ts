import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CrearPuntoInteresDto } from './dto/crear-punto-interes.dto';
import { PuntosInteresService } from './puntos-interes.service';

@Controller('puntos-interes')
export class PuntosInteresController {
  constructor(private readonly service: PuntosInteresService) {}

  @Get()
  listarOptimizado() {
    return this.service.listarOptimizado();
  }

  @Get('demo/n-plus-one')
  listarConNPlusUno() {
    return this.service.listarConNPlusUno();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  crear(@Body() datos: CrearPuntoInteresDto) {
    return this.service.crear(datos);
  }
}
