import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';
import type { Rol } from '../generated/prisma/enums';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  listarPublicados() {
    return this.prisma.evento.findMany({
      where: {
        estado: 'PUBLICADO',
        fechaFin: { gte: new Date() },
      },
      orderBy: { fechaInicio: 'asc' },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        direccion: true,
        latitud: true,
        longitud: true,
        puntoInteres: { select: { id: true, nombre: true } },
      },
    });
  }

  async crear(creadorId: number, datos: CrearEventoDto) {
    const creador = await this.prisma.usuario.findUnique({
      where: { id: creadorId },
      select: { activo: true, rol: true, proveedorVerificado: true },
    });
    if (
      !creador?.activo ||
      (creador.rol === 'PROVEEDOR' && !creador.proveedorVerificado)
    ) {
      throw new BadRequestException('El proveedor debe estar verificado');
    }

    const fechaInicio = new Date(datos.fechaInicio);
    const fechaFin = new Date(datos.fechaFin);
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (datos.puntoInteresId) {
      const punto = await this.prisma.puntoInteres.findUnique({
        where: { id: datos.puntoInteresId },
        select: { id: true, estado: true },
      });
      if (!punto || punto.estado !== 'ACTIVO') {
        throw new NotFoundException('El punto de interés no existe');
      }
    }

    return this.prisma.evento.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        fechaInicio,
        fechaFin,
        direccion: datos.direccion,
        latitud: datos.latitud,
        longitud: datos.longitud,
        creadorId,
        puntoInteresId: datos.puntoInteresId,
        estado: 'PUBLICADO',
      },
      select: {
        id: true,
        titulo: true,
        fechaInicio: true,
        fechaFin: true,
        estado: true,
      },
    });
  }

  async actualizar(
    creadorId: number,
    rol: Rol,
    id: number,
    datos: ActualizarEventoDto,
  ) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      select: { creadorId: true, fechaInicio: true, fechaFin: true },
    });
    if (!evento) throw new NotFoundException('El evento no existe');
    if (rol !== 'ADMINISTRADOR' && evento.creadorId !== creadorId) {
      throw new BadRequestException('No puedes modificar este evento');
    }

    const fechaInicio = datos.fechaInicio
      ? new Date(datos.fechaInicio)
      : evento.fechaInicio;
    const fechaFin = datos.fechaFin
      ? new Date(datos.fechaFin)
      : evento.fechaFin;
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    return this.prisma.evento.update({
      where: { id },
      data: {
        ...datos,
        fechaInicio,
        fechaFin,
      },
      select: {
        id: true,
        titulo: true,
        fechaInicio: true,
        fechaFin: true,
        estado: true,
      },
    });
  }
}
