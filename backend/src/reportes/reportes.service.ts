import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearReporteDto } from './dto/crear-reporte.dto';
import { ActualizarReporteDto } from './dto/actualizar-reporte.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.reporte.findMany({
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true,
        motivo: true,
        descripcion: true,
        estado: true,
        puntoInteresId: true,
        creadoEn: true,
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  }

  async actualizar(id: number, datos: ActualizarReporteDto) {
    try {
      return await this.prisma.reporte.update({
        where: { id },
        data: { estado: datos.estado },
        select: { id: true, estado: true, actualizadoEn: true },
      });
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException('El reporte no existe');
      }
      throw error;
    }
  }

  async crear(usuarioId: number, datos: CrearReporteDto) {
    const punto = await this.prisma.puntoInteres.findUnique({
      where: { id: datos.puntoInteresId },
      select: { id: true },
    });
    if (!punto) throw new NotFoundException('El punto de interés no existe');

    return this.prisma.reporte.create({
      data: {
        usuarioId,
        puntoInteresId: datos.puntoInteresId,
        motivo: datos.motivo,
        descripcion: datos.descripcion,
      },
      select: {
        id: true,
        motivo: true,
        descripcion: true,
        estado: true,
        puntoInteresId: true,
        creadoEn: true,
      },
    });
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    );
  }
}
