import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CategoriasService],
  controllers: [CategoriasController],
})
export class CategoriasModule {}
