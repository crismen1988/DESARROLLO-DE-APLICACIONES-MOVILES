import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './nest.module';
import { ENV } from './config/environment';
import { db } from './db/store';
import { ApiExceptionFilter } from './security/api-exception.filter';
import { apiRateLimit } from './security/rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function startServer() {
  await db.initialize();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  if (process.env.TRUST_PROXY === 'true') app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));
  app.use(express.urlencoded({ extended: true, limit: '4mb' }));
  const allowedOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean));
  const nativeOrigins = [
    'https://localhost',
    'capacitor://localhost',
  ];
  const developmentOrigins = [
    'http://localhost', 'http://localhost:3000', 'http://localhost:5173',
    'http://127.0.0.1', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173',
    'capacitor://10.0.2.2', 'http://10.0.2.2', 'http://10.0.2.2:3000',
  ];
  nativeOrigins.forEach(origin => allowedOrigins.add(origin));
  if (!ENV.IS_PROD) developmentOrigins.forEach(origin => allowedOrigins.add(origin));
  app.enableCors({
    credentials: true,
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => callback(null, !origin || allowedOrigins.has(origin)),
  });
  app.use(apiRateLimit);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix('api');
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (ENV.IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  if (process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BañosTour API')
      .setDescription('Contrato técnico de la API de BañosTour')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      swaggerOptions: { persistAuthorization: false },
    });
  }

  await app.init();
  await app.listen(ENV.PORT, '0.0.0.0');
  console.log(`[BañosTour API] NestJS escuchando en http://0.0.0.0:${ENV.PORT}/api`);
}

startServer().catch(error => {
  console.error('[BañosTour API] No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});
