import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CrearResenaDto } from './dto/crear-resena.dto';

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
}
