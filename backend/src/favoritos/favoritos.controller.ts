import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { FavoritosService } from './favoritos.service';

@Controller('favoritos')
@UseGuards(AuthGuard)
export class FavoritosController {
  constructor(private readonly service: FavoritosService) {}

  @Get()
  listar(@Req() request: AuthenticatedRequest) {
    return this.service.listar(request.user.sub);
  }

  @Post(':puntoInteresId')
  agregar(
    @Req() request: AuthenticatedRequest,
    @Param('puntoInteresId', ParseIntPipe) puntoInteresId: number,
  ) {
    return this.service.agregar(request.user.sub, puntoInteresId);
  }

  @Delete(':puntoInteresId')
  @HttpCode(204)
  async eliminar(
    @Req() request: AuthenticatedRequest,
    @Param('puntoInteresId', ParseIntPipe) puntoInteresId: number,
  ): Promise<void> {
    await this.service.eliminar(request.user.sub, puntoInteresId);
  }
}
