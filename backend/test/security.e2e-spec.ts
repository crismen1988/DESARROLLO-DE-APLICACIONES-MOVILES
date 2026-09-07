import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Security and public API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite consultar eventos sin autenticación', async () => {
    await request(app.getHttpServer()).get('/eventos').expect(200);
  });

  it('rechaza favoritos sin autenticación', async () => {
    await request(app.getHttpServer()).get('/favoritos').expect(401);
  });

  it('rechaza reportes sin autenticación', async () => {
    await request(app.getHttpServer())
      .post('/reportes')
      .send({
        puntoInteresId: 1,
        motivo: 'Prueba',
      })
      .expect(401);
  });

  it('rechaza credenciales de registro no válidas', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({
        correo: 'no-es-correo',
        nombre: 'A',
        password: 'corta',
      })
      .expect(400);
  });
});
