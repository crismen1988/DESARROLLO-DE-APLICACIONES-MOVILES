import { Module } from '@nestjs/common';
import { PuntosInteresController } from './puntos-interes.controller';
import { PuntosInteresService } from './puntos-interes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PuntosInteresController],
  providers: [PuntosInteresService],
})
export class PuntosInteresModule {}
