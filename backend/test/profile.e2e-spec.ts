import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type PerfilRespuesta = {
  direccion: string | null;
  fechaNacimiento: string | null;
  edad: number | null;
  estadisticas: Record<string, number | null>;
};
type ActividadRespuesta = {
  total: number;
  datos: Array<{
    id: number;
    comentario?: string;
    puntoInteres: { imagenes: Array<{ url: string }> };
  }>;
};

describe('Perfil y actividad privada (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let proveedorToken: string;
  let usuarioId: number;
  let proveedorId: number;
  let otroId: number;
  let categoriaId: number;
  const ids: number[] = [];
  const marca = `perfil-e2e-${Date.now()}`;

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
    prisma = app.get(PrismaService);
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Prueba perfil',
        correo: `${marca}@example.test`,
        passwordHash: 'test-only-unusable',
      },
    });
    usuarioId = usuario.id;
    const proveedor = await prisma.usuario.create({
      data: {
        nombre: 'Prueba proveedor',
        correo: `${marca}-provider@example.test`,
        passwordHash: 'test-only-unusable',
        rol: 'PROVEEDOR',
        tipoCuenta: 'PRESTADOR_TURISTICO',
      },
    });
    proveedorId = proveedor.id;
    const otro = await prisma.usuario.create({
      data: {
        nombre: 'Otra persona',
        correo: `${marca}-other@example.test`,
        passwordHash: 'test-only-unusable',
      },
    });
    otroId = otro.id;
    const categoria = await prisma.categoria.create({
      data: { nombre: marca },
    });
    categoriaId = categoria.id;
    for (let index = 0; index < 13; index++) {
      const lugar = await prisma.puntoInteres.create({
        data: {
          nombre: `${marca}-${index}`,
          descripcion: 'Fixture de prueba',
          latitud: 0,
          longitud: 0,
          categoriaId,
          propietarioId: proveedorId,
          imagenes: {
            create: { url: 'https://example.test/place.jpg', orden: 0 },
          },
        },
      });
      ids.push(lugar.id);
      await prisma.favorito.create({
        data: { usuarioId, puntoInteresId: lugar.id },
      });
    }
    await prisma.resena.create({
      data: {
        usuarioId,
        puntoInteresId: ids[0],
        calificacion: 5,
        comentario: 'Mi experiencia',
      },
    });
    await prisma.resena.create({
      data: {
        usuarioId: otroId,
        puntoInteresId: ids[1],
        calificacion: 3,
        comentario: 'Experiencia ajena',
      },
    });
    await prisma.favorito.create({
      data: { usuarioId: otroId, puntoInteresId: ids[0] },
    });
    token = app.get(JwtService).sign({ sub: usuarioId, rol: 'TURISTA' });
    proveedorToken = app
      .get(JwtService)
      .sign({ sub: proveedorId, rol: 'PROVEEDOR' });
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.puntoInteres.deleteMany({ where: { id: { in: ids } } });
      if (categoriaId)
        await prisma.categoria.delete({ where: { id: categoriaId } });
      await prisma.usuario.deleteMany({
        where: { id: { in: [usuarioId, proveedorId, otroId].filter(Boolean) } },
      });
    }
    await app?.close();
  });

  it('requiere autenticación para consultar la actividad', async () => {
    await request(app.getHttpServer())
      .get('/usuarios/perfil/actividad')
      .expect(401);
  });

  it('cuenta la actividad propia y calcula la valoración recibida', async () => {
    const propia = await request(app.getHttpServer())
      .get('/usuarios/perfil')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect((propia.body as PerfilRespuesta).estadisticas).toMatchObject({
      favoritos: 13,
      resenas: 1,
      lugares: 0,
      valoracion: null,
    });
    const proveedor = await request(app.getHttpServer())
      .get('/usuarios/perfil')
      .auth(proveedorToken, { type: 'bearer' })
      .expect(200);
    expect((proveedor.body as PerfilRespuesta).estadisticas).toMatchObject({
      lugares: 13,
      resenasRecibidas: 2,
      valoracion: 4,
    });
  });

  it('pagina favoritos sin duplicados y devuelve su imagen', async () => {
    const primera = await request(app.getHttpServer())
      .get('/usuarios/perfil/actividad?tipo=favoritos&pagina=1')
      .auth(token, { type: 'bearer' })
      .expect(200);
    const segunda = await request(app.getHttpServer())
      .get('/usuarios/perfil/actividad?tipo=favoritos&pagina=2')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect((primera.body as ActividadRespuesta).total).toBe(13);
    expect((primera.body as ActividadRespuesta).datos).toHaveLength(12);
    expect((segunda.body as ActividadRespuesta).datos).toHaveLength(1);
    expect(
      new Set(
        [
          ...(primera.body as ActividadRespuesta).datos,
          ...(segunda.body as ActividadRespuesta).datos,
        ].map((item: { id: number }) => item.id),
      ).size,
    ).toBe(13);
    expect(
      (primera.body as ActividadRespuesta).datos[0].puntoInteres.imagenes[0]
        .url,
    ).toBe('https://example.test/place.jpg');
  });

  it('no mezcla reseñas ni lugares de otras cuentas', async () => {
    const resenas = await request(app.getHttpServer())
      .get('/usuarios/perfil/actividad?tipo=resenas')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect((resenas.body as ActividadRespuesta).total).toBe(1);
    expect((resenas.body as ActividadRespuesta).datos[0].comentario).toBe(
      'Mi experiencia',
    );
    const lugares = await request(app.getHttpServer())
      .get('/usuarios/perfil/actividad?tipo=lugares')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect((lugares.body as ActividadRespuesta).datos).toEqual([]);
    await request(app.getHttpServer())
      .get(`/usuarios/perfil/actividad?tipo=resenas&usuarioId=${otroId}`)
      .auth(token, { type: 'bearer' })
      .expect(400);
  });

  it('guarda dirección y fecha de nacimiento y permite vaciar datos opcionales', async () => {
    const guardado = await request(app.getHttpServer())
      .patch('/usuarios/perfil')
      .auth(token, { type: 'bearer' })
      .send({
        direccion: 'Dirección de prueba',
        fechaNacimiento: '2000-03-15',
        edad: 26,
      })
      .expect(200);
    expect((guardado.body as PerfilRespuesta).direccion).toBe(
      'Dirección de prueba',
    );
    expect((guardado.body as PerfilRespuesta).fechaNacimiento).toContain(
      '2000-03-15',
    );
    expect((guardado.body as PerfilRespuesta).estadisticas.favoritos).toBe(13);
    const vaciado = await request(app.getHttpServer())
      .patch('/usuarios/perfil')
      .auth(token, { type: 'bearer' })
      .send({ fechaNacimiento: null, edad: null })
      .expect(200);
    expect((vaciado.body as PerfilRespuesta).fechaNacimiento).toBeNull();
    expect((vaciado.body as PerfilRespuesta).edad).toBeNull();
  });

  it('rechaza páginas y tipos no válidos', async () => {
    for (const query of [
      'pagina=0',
      'pagina=-1',
      'pagina=abc',
      'tipo=usuarios',
    ]) {
      await request(app.getHttpServer())
        .get(`/usuarios/perfil/actividad?${query}`)
        .auth(token, { type: 'bearer' })
        .expect(400);
    }
  });
});
