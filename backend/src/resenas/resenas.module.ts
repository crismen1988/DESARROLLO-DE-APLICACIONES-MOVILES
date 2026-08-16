import { Module } from '@nestjs/common';
import { ResenasController } from './resenas.controller';
import { ResenasService } from './resenas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}
