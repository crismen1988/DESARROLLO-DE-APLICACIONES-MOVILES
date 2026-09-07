import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CrearPuntoInteresDto } from './dto/crear-punto-interes.dto';
import { ActualizarPuntoInteresDto } from './dto/actualizar-punto-interes.dto';
import type { Rol } from '../generated/prisma/enums';
import {
  ContactoDto,
  HorarioDto,
  ImagenDto,
} from './dto/catalogo-adicional.dto';
import { ConsultarPuntosInteresDto } from './dto/consultar-puntos-interes.dto';

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
  async listarOptimizado(
    consulta: ConsultarPuntosInteresDto = new ConsultarPuntosInteresDto(),
  ) {
    const pagina = consulta.pagina ?? 1;
    const limite = consulta.limite ?? 20;
    const busqueda = consulta.busqueda?.trim();
    const cacheKey = `${CACHE_KEY}:p${pagina}:l${limite}:q${encodeURIComponent(busqueda ?? '')}:c${consulta.categoriaId ?? ''}`;
    const cached = await this.redis.get<{ datos: unknown[]; total: number }>(
      cacheKey,
    );
    if (cached) {
      return {
        fuente: 'cache',
        pagina,
        limite,
        total: cached.total,
        datos: cached.datos,
      };
    }

    const where = {
      estado: 'ACTIVO' as const,
      ...(consulta.categoriaId ? { categoriaId: consulta.categoriaId } : {}),
      ...(busqueda
        ? {
            OR: [
              { nombre: { contains: busqueda, mode: 'insensitive' as const } },
              {
                descripcion: {
                  contains: busqueda,
                  mode: 'insensitive' as const,
                },
              },
              {
                direccion: { contains: busqueda, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [total, puntos] = await this.prisma.$transaction([
      this.prisma.puntoInteres.count({ where }),
      this.prisma.puntoInteres.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (pagina - 1) * limite,
        take: limite,
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
      }),
    ]);

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

    await this.redis.set(cacheKey, { datos, total }, CACHE_TTL_SECONDS);
    return {
      fuente: 'base-de-datos',
      ttlSegundos: CACHE_TTL_SECONDS,
      pagina,
      limite,
      total,
      datos,
    };
  }

  async crear(usuarioId: number, datos: CrearPuntoInteresDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: true, activo: true, proveedorVerificado: true },
    });
    if (
      !usuario?.activo ||
      (usuario.rol === 'PROVEEDOR' && !usuario.proveedorVerificado)
    ) {
      throw new ForbiddenException('El proveedor aún no está verificado');
    }

    const categoria = await this.prisma.categoria.findUnique({
      where: { id: datos.categoriaId },
    });
    if (!categoria) throw new NotFoundException('La categoría no existe');

    const punto = await this.prisma.puntoInteres.create({
      data: {
        ...datos,
        propietarioId: usuario.rol === 'PROVEEDOR' ? usuarioId : undefined,
      },
    });
    await this.invalidarCache();
    return punto;
  }

  async buscarPorId(id: number) {
    const punto = await this.prisma.puntoInteres.findFirst({
      where: { id, estado: 'ACTIVO' },
      include: {
        categoria: true,
        horarios: { orderBy: { dia: 'asc' } },
        imagenes: { orderBy: { orden: 'asc' } },
        contacto: true,
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

  async actualizar(
    usuarioId: number,
    rol: Rol,
    id: number,
    datos: ActualizarPuntoInteresDto,
  ) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id },
      select: { propietarioId: true, estado: true },
    });
    if (!punto || punto.estado !== 'ACTIVO') {
      throw new NotFoundException('El punto de interés no existe');
    }
    if (rol !== 'ADMINISTRADOR' && punto.propietarioId !== usuarioId) {
      throw new ForbiddenException('No puedes modificar este punto de interés');
    }
    if (datos.categoriaId) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: datos.categoriaId },
        select: { activa: true },
      });
      if (!categoria?.activa)
        throw new NotFoundException('La categoría no existe');
    }

    const actualizado = await this.prisma.puntoInteres.update({
      where: { id },
      data: datos,
    });
    await this.invalidarCache();
    return actualizado;
  }

  async eliminar(usuarioId: number, rol: Rol, id: number) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id },
      select: { propietarioId: true, estado: true },
    });
    if (!punto || punto.estado !== 'ACTIVO') {
      throw new NotFoundException('El punto de interés no existe');
    }
    if (rol !== 'ADMINISTRADOR' && punto.propietarioId !== usuarioId) {
      throw new ForbiddenException('No puedes eliminar este punto de interés');
    }

    const eliminado = await this.prisma.puntoInteres.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });
    await this.invalidarCache();
    return eliminado;
  }

  async invalidarCache() {
    await this.redis.delByPrefix(CACHE_KEY);
  }

  private async verificarPropiedad(usuarioId: number, rol: Rol, id: number) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id },
      select: { propietarioId: true, estado: true },
    });
    if (!punto || punto.estado !== 'ACTIVO')
      throw new NotFoundException('El punto de interés no existe');
    if (rol !== 'ADMINISTRADOR' && punto.propietarioId !== usuarioId) {
      throw new ForbiddenException('No puedes modificar este punto de interés');
    }
  }

  async actualizarHorarios(
    usuarioId: number,
    rol: Rol,
    id: number,
    horarios: HorarioDto[],
  ) {
    await this.verificarPropiedad(usuarioId, rol, id);
    const dias = horarios.map((horario) => horario.dia);
    if (new Set(dias).size !== dias.length) {
      throw new ForbiddenException('No puede haber más de un horario por día');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.horarioPuntoInteres.deleteMany({
        where: { puntoInteresId: id },
      });
      await tx.horarioPuntoInteres.createMany({
        data: horarios.map((horario) => ({
          puntoInteresId: id,
          dia: horario.dia,
          apertura: horario.apertura,
          cierre: horario.cierre,
        })),
      });
      return tx.horarioPuntoInteres.findMany({
        where: { puntoInteresId: id },
        orderBy: { dia: 'asc' },
      });
    });
  }

  async agregarImagen(
    usuarioId: number,
    rol: Rol,
    id: number,
    imagen: ImagenDto,
  ) {
    await this.verificarPropiedad(usuarioId, rol, id);
    const total = await this.prisma.imagenPuntoInteres.count({
      where: { puntoInteresId: id },
    });
    if (total >= 20)
      throw new ForbiddenException('El POI no puede tener más de 20 imágenes');
    return this.prisma.imagenPuntoInteres.create({
      data: { puntoInteresId: id, ...imagen },
    });
  }

  async actualizarContacto(
    usuarioId: number,
    rol: Rol,
    id: number,
    contacto: ContactoDto,
  ) {
    await this.verificarPropiedad(usuarioId, rol, id);
    return this.prisma.contactoPuntoInteres.upsert({
      where: { puntoInteresId: id },
      create: { puntoInteresId: id, ...contacto },
      update: contacto,
    });
  }
}
