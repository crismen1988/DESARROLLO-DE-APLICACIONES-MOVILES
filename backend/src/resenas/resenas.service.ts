import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { ActualizarResenaDto } from './dto/actualizar-resena.dto';
import type { Rol } from '../generated/prisma/enums';

@Injectable()
export class ResenasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async crear(usuarioId: number, datos: CrearResenaDto) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id: datos.puntoInteresId },
    });
    if (!punto) throw new NotFoundException('El punto de interés no existe');

    const previa = await this.prisma.resena.findUnique({
      where: {
        usuarioId_puntoInteresId: {
          usuarioId,
          puntoInteresId: datos.puntoInteresId,
        },
      },
    });
    if (previa) throw new ConflictException('El usuario ya reseñó este lugar');

    const resena = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.resena.create({
        data: {
          calificacion: datos.calificacion,
          comentario: datos.comentario,
          usuarioId,
          puntoInteresId: datos.puntoInteresId,
        },
      });
      const agregado = await tx.resena.aggregate({
        where: { puntoInteresId: datos.puntoInteresId },
        _avg: { calificacion: true },
        _count: { _all: true },
      });
      await tx.puntoInteres.update({
        where: { id: datos.puntoInteresId },
        data: {
          calificacionPromedio: agregado._avg.calificacion ?? 0,
          totalResenas: agregado._count._all,
        },
      });
      return creada;
    });

    await this.notificaciones.encolar({
      usuarioId,
      titulo: 'Reseña registrada',
      mensaje: `Tu reseña para ${punto.nombre} fue registrada correctamente.`,
    });
    return resena;
  }

  async actualizar(
    usuarioId: number,
    rol: Rol,
    resenaId: number,
    datos: ActualizarResenaDto,
  ) {
    const resena = await this.prisma.resena.findUnique({
      where: { id: resenaId },
      select: { usuarioId: true, puntoInteresId: true },
    });
    if (!resena) throw new NotFoundException('La reseña no existe');
    if (resena.usuarioId !== usuarioId && rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('No puedes modificar esta reseña');
    }

    return this.prisma.$transaction(async (tx) => {
      const actualizada = await tx.resena.update({
        where: { id: resenaId },
        data: datos,
      });
      await this.recalcularPromedio(tx, resena.puntoInteresId);
      return actualizada;
    });
  }

  async eliminar(usuarioId: number, rol: Rol, resenaId: number): Promise<void> {
    const resena = await this.prisma.resena.findUnique({
      where: { id: resenaId },
      select: { usuarioId: true, puntoInteresId: true },
    });
    if (!resena) throw new NotFoundException('La reseña no existe');
    if (resena.usuarioId !== usuarioId && rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('No puedes eliminar esta reseña');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.resena.delete({ where: { id: resenaId } });
      await this.recalcularPromedio(tx, resena.puntoInteresId);
    });
  }

  private async recalcularPromedio(
    tx: Pick<PrismaService, 'resena' | 'puntoInteres'>,
    puntoInteresId: number,
  ): Promise<void> {
    const agregado = await tx.resena.aggregate({
      where: { puntoInteresId },
      _avg: { calificacion: true },
      _count: { _all: true },
    });
    await tx.puntoInteres.update({
      where: { id: puntoInteresId },
      data: {
        calificacionPromedio: agregado._avg.calificacion ?? 0,
        totalResenas: agregado._count._all,
      },
    });
  }
}
