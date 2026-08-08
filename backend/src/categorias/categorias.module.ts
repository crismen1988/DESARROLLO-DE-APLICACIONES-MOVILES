import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';

@Module({
  imports: [PrismaModule],
  providers: [CategoriasService],
  controllers: [CategoriasController],
})
export class CategoriasModule {}
