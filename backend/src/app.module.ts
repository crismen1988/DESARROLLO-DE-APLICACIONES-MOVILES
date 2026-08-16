import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriasModule } from './categorias/categorias.module';
import { RedisModule } from './redis/redis.module';
import { PuntosInteresModule } from './puntos-interes/puntos-interes.module';
import { AuthModule } from './auth/auth.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { ResenasModule } from './resenas/resenas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    CategoriasModule,
    PuntosInteresModule,
    AuthModule,
    NotificacionesModule,
    ResenasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
