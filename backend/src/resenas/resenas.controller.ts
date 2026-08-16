import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { ResenasService } from './resenas.service';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly service: ResenasService) {}

  @Post()
  @UseGuards(AuthGuard)
  crear(@Req() request: AuthenticatedRequest, @Body() datos: CrearResenaDto) {
    return this.service.crear(request.user.sub, datos);
  }
}
