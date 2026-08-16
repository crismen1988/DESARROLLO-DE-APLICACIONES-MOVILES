import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CrearPuntoInteresDto } from './dto/crear-punto-interes.dto';

const CACHE_KEY = 'banostour:puntos-interes:activos:v1';
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? 60);

@Injectable()
export class PuntosInteresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Versión didáctica que reproduce el problema N+1. */
  async listarConNPlusUno() {
    const puntos = await this.prisma.puntoInteres.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
    });

    return Promise.all(
      puntos.map(async (punto) => {
        const categoria = await this.prisma.categoria.findUnique({
          where: { id: punto.categoriaId },
        });
        const resenas = await this.prisma.resena.findMany({
          where: { puntoInteresId: punto.id },
          select: { calificacion: true },
        });
        return { ...punto, categoria, resenas };
      }),
    );
  }

  /** Versión optimizada: eager loading + selección mínima de campos. */
  async listarOptimizado() {
    const cached = await this.redis.get<unknown[]>(CACHE_KEY);
    if (cached) return { fuente: 'cache', datos: cached };

    const puntos = await this.prisma.puntoInteres.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        direccion: true,
        latitud: true,
        longitud: true,
        calificacionPromedio: true,
        totalResenas: true,
        categoria: { select: { id: true, nombre: true } },
        resenas: { select: { calificacion: true } },
      },
    });

    const datos = puntos.map(({ resenas, ...punto }) => ({
      ...punto,
      calificacionCalculada:
        resenas.length === 0
          ? 0
          : Number(
              (
                resenas.reduce((sum, item) => sum + item.calificacion, 0) /
                resenas.length
              ).toFixed(2),
            ),
      totalResenas: resenas.length,
    }));

    await this.redis.set(CACHE_KEY, datos, CACHE_TTL_SECONDS);
    return { fuente: 'base-de-datos', ttlSegundos: CACHE_TTL_SECONDS, datos };
  }

  async crear(datos: CrearPuntoInteresDto) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: datos.categoriaId },
    });
    if (!categoria) throw new NotFoundException('La categoría no existe');

    const punto = await this.prisma.puntoInteres.create({ data: datos });
    await this.invalidarCache();
    return punto;
  }

  async buscarPorId(id: number) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id },
      include: {
        categoria: true,
        resenas: {
          select: {
            id: true,
            calificacion: true,
            comentario: true,
            creadoEn: true,
          },
        },
      },
    });
    if (!punto) throw new NotFoundException('El punto de interés no existe');
    return punto;
  }

  async invalidarCache() {
    await this.redis.del(CACHE_KEY);
  }
}
