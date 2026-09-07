import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(usuarioId: number) {
    return this.prisma.favorito.findMany({
      where: { usuarioId },
      orderBy: { agregadoEn: 'desc' },
      select: {
        puntoInteresId: true,
        agregadoEn: true,
        puntoInteres: {
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
          },
        },
      },
    });
  }

  async agregar(usuarioId: number, puntoInteresId: number) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id: puntoInteresId },
      select: { id: true, estado: true },
    });

    if (!punto || punto.estado !== 'ACTIVO') {
      throw new NotFoundException('El punto de interés no existe');
    }

    const existente = await this.prisma.favorito.findUnique({
      where: { usuarioId_puntoInteresId: { usuarioId, puntoInteresId } },
    });
    if (existente) throw new ConflictException('El POI ya está en favoritos');

    return this.prisma.favorito.create({
      data: { usuarioId, puntoInteresId },
      select: { usuarioId: true, puntoInteresId: true, agregadoEn: true },
    });
  }

  async eliminar(usuarioId: number, puntoInteresId: number): Promise<void> {
    await this.prisma.favorito.deleteMany({
      where: { usuarioId, puntoInteresId },
    });
  }
}
