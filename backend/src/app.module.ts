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
import { FavoritosModule } from './favoritos/favoritos.module';
import { EventosModule } from './eventos/eventos.module';
import { ReportesModule } from './reportes/reportes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
          if (
            typeof config[key] !== 'string' ||
            config[key].trim().length < 16
          ) {
            throw new Error(
              `${key} debe estar configurada y tener al menos 16 caracteres`,
            );
          }
        }
        return config;
      },
    }),
    PrismaModule,
    RedisModule,
    CategoriasModule,
    PuntosInteresModule,
    AuthModule,
    NotificacionesModule,
    ResenasModule,
    FavoritosModule,
    EventosModule,
    ReportesModule,
    UsuariosModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
