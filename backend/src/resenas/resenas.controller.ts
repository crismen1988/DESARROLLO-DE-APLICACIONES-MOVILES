import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { ActualizarResenaDto } from './dto/actualizar-resena.dto';
import { ResenasService } from './resenas.service';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly service: ResenasService) {}

  @Post()
  @UseGuards(AuthGuard)
  crear(@Req() request: AuthenticatedRequest, @Body() datos: CrearResenaDto) {
    return this.service.crear(request.user.sub, datos);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  actualizar(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarResenaDto,
  ) {
    return this.service.actualizar(
      request.user.sub,
      request.user.rol,
      id,
      datos,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async eliminar(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.service.eliminar(request.user.sub, request.user.rol, id);
  }
}
