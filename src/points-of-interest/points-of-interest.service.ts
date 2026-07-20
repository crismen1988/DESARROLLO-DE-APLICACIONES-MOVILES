import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePointsOfInterestDto } from './dto/create-points-of-interest.dto';
import { UpdatePointsOfInterestDto } from './dto/update-points-of-interest.dto';

@Injectable()
export class PointsOfInterestService {
  private readonly cacheKey = 'points-of-interest:all';
  private readonly cacheTtlSeconds = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createPointsOfInterestDto: CreatePointsOfInterestDto,
  ) {
    const inicio = performance.now();

    const punto = await this.prisma.puntoInteres.create({
      data: createPointsOfInterestDto,
      include: {
        categoria: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });

    await this.redisService.delete(this.cacheKey);

    console.log(
      '🗑️ Caché invalidada después de crear un punto',
    );

    const job =
      await this.notificationsService.addPointCreatedJob({
        puntoId: punto.id,
        nombre: punto.nombre,
        direccion: punto.direccion,
        usuarioId: punto.usuarioId,
      });

    const fin = performance.now();

    console.log(
      `📥 Petición principal terminada en ${(fin - inicio).toFixed(2)} ms`,
    );

    return {
      message: 'Punto de interés creado correctamente',
      punto,
      asyncTask: {
        jobId: job.id,
        status: 'queued',
        message:
          'La notificación será procesada por el worker',
      },
    };
  }

  findAll() {
    return this.prisma.puntoInteres.findMany({
      include: {
        categoria: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllWithNPlusOne() {
    const inicio = performance.now();

    const puntos =
      await this.prisma.puntoInteres.findMany();

    const resultado: unknown[] = [];

    for (const punto of puntos) {
      const categoria =
        await this.prisma.categoria.findUnique({
          where: {
            id: punto.categoriaId,
          },
        });

      const usuario =
        await this.prisma.usuario.findUnique({
          where: {
            id: punto.usuarioId,
          },
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        });

      const resenas =
        await this.prisma.resena.findMany({
          where: {
            puntoId: punto.id,
          },
        });

      resultado.push({
        ...punto,
        categoria,
        usuario,
        resenas,
      });
    }

    const fin = performance.now();

    console.log(
      `⏱ N+1 tardó ${(fin - inicio).toFixed(2)} ms`,
    );

    return resultado;
  }

  async findAllOptimized() {
    const inicio = performance.now();

    const resultado =
      await this.prisma.puntoInteres.findMany({
        include: {
          categoria: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          resenas: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    const fin = performance.now();

    console.log(
      `⚡ Optimizado tardó ${(fin - inicio).toFixed(2)} ms`,
    );

    return resultado;
  }

  async findAllCached() {
    const inicio = performance.now();

    const cachedData =
      await this.redisService.get<unknown[]>(
        this.cacheKey,
      );

    if (cachedData) {
      const fin = performance.now();

      console.log(
        '🟢 CACHE HIT: datos obtenidos desde Redis',
      );

      console.log(
        `🚀 Con caché tardó ${(fin - inicio).toFixed(2)} ms`,
      );

      return {
        source: 'redis',
        data: cachedData,
      };
    }

    console.log(
      '🔴 CACHE MISS: consultando PostgreSQL',
    );

    const puntos =
      await this.prisma.puntoInteres.findMany({
        include: {
          categoria: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          resenas: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    await this.redisService.set(
      this.cacheKey,
      puntos,
      this.cacheTtlSeconds,
    );

    const fin = performance.now();

    console.log(
      `💾 Base de datos + guardar caché tardó ${(fin - inicio).toFixed(2)} ms`,
    );

    console.log(
      `⏳ TTL configurado: ${this.cacheTtlSeconds} segundos`,
    );

    return {
      source: 'database',
      data: puntos,
    };
  }

  findOne(id: number) {
    return this.prisma.puntoInteres.findUnique({
      where: {
        id,
      },
      include: {
        categoria: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        resenas: true,
        favoritos: true,
      },
    });
  }

  async update(
    id: number,
    updatePointsOfInterestDto: UpdatePointsOfInterestDto,
  ) {
    const punto =
      await this.prisma.puntoInteres.update({
        where: {
          id,
        },
        data: updatePointsOfInterestDto,
        include: {
          categoria: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
            },
          },
        },
      });

    await this.redisService.delete(this.cacheKey);

    console.log(
      '🗑️ Caché invalidada después de actualizar un punto',
    );

    return punto;
  }

  async remove(id: number) {
    const punto =
      await this.prisma.puntoInteres.delete({
        where: {
          id,
        },
      });

    await this.redisService.delete(this.cacheKey);

    console.log(
      '🗑️ Caché invalidada después de eliminar un punto',
    );

    return punto;
  }
}
