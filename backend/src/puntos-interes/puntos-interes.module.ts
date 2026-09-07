import { Module } from '@nestjs/common';
import { PuntosInteresController } from './puntos-interes.controller';
import { PuntosInteresService } from './puntos-interes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PuntosInteresController],
  providers: [PuntosInteresService],
})
export class PuntosInteresModule {}
