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
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CrearReporteDto } from './dto/crear-reporte.dto';
import { ActualizarReporteDto } from './dto/actualizar-reporte.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(AuthGuard)
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Post()
  crear(@Req() request: AuthenticatedRequest, @Body() datos: CrearReporteDto) {
    return this.service.crear(request.user.sub, datos);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  listar() {
    return this.service.listar();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarReporteDto,
  ) {
    return this.service.actualizar(id, datos);
  }
}
