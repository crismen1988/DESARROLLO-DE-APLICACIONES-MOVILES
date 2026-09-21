import 'reflect-metadata';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './nest.module';
import { ENV } from './config/environment';
import { db } from './db/store';
import { ApiExceptionFilter } from './security/api-exception.filter';

async function startServer() {
  await db.initialize();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(express.json({ limit: '4mb' }));
  app.use(express.urlencoded({ extended: true, limit: '4mb' }));
  const allowedOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean));
  const defaultOrigins = [
    'https://localhost',
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://192.168.1.18',
    'http://192.168.1.18:3000',
    'http://192.168.1.18:5173',
    'capacitor://localhost',
    'capacitor://10.0.2.2',
    'http://10.0.2.2',
    'http://10.0.2.2:3000',
  ];
  defaultOrigins.forEach(origin => allowedOrigins.add(origin));
  app.enableCors({
    credentials: true,
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => callback(null, !origin || allowedOrigins.has(origin)),
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix('api');
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  await app.init();
  await app.listen(ENV.PORT, '0.0.0.0');
  console.log(`[BañosTour API] NestJS escuchando en http://0.0.0.0:${ENV.PORT}/api`);
}

startServer().catch(error => {
  console.error('[BañosTour API] No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});
