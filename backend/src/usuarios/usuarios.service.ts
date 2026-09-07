import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { AdministrarUsuarioDto } from './dto/administrar-usuario.dto';
import { esRucEcuatorianoValido } from '../auth/ruc.validator';
import { compare, hash } from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ActividadPerfilDto } from './dto/actividad-perfil.dto';
import type { Prisma } from '../generated/prisma/client';

const publicUserSelect = {
  id: true,
  correo: true,
  nombre: true,
  descripcion: true,
  fotoPerfil: true,
  fechaNacimiento: true,
  edad: true,
  paisOrigen: true,
  direccion: true,
  nombreComercial: true,
  ciudad: true,
  actividadTuristica: true,
  rol: true,
  activo: true,
  proveedorVerificado: true,
  tipoCuenta: true,
  ruc: true,
  estadoVerificacion: true,
  creadoEn: true,
  actualizadoEn: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPerfil(usuarioId: number) {
    const [usuario, recibidas] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          ...publicUserSelect,
          _count: {
            select: {
              favoritos: true,
              resenas: true,
              puntosPropios: { where: { estado: 'ACTIVO' } },
            },
          },
        },
      }),
      this.prisma.resena.aggregate({
        where: { puntoInteres: { propietarioId: usuarioId, estado: 'ACTIVO' } },
        _count: true,
        _avg: { calificacion: true },
      }),
    ]);
    if (!usuario) throw new NotFoundException('El usuario no existe');
    const { _count, ...perfil } = usuario;
    return {
      ...perfil,
      estadisticas: {
        favoritos: _count.favoritos,
        resenas: _count.resenas,
        lugares: _count.puntosPropios,
        resenasRecibidas: recibidas._count,
        valoracion: recibidas._avg.calificacion,
      },
    };
  }

  async obtenerActividad(
    usuarioId: number,
    { tipo, pagina }: ActividadPerfilDto,
  ) {
    const limite = 12;
    const paginacion = { skip: (pagina - 1) * limite, take: limite };
    const lugarSelect = {
      id: true,
      nombre: true,
      descripcion: true,
      estado: true,
      calificacionPromedio: true,
      totalResenas: true,
      categoria: { select: { nombre: true } },
      imagenes: {
        orderBy: [{ orden: 'asc' as const }, { id: 'asc' as const }],
        take: 1,
        select: { url: true, textoAlternativo: true },
      },
    } satisfies Prisma.PuntoInteresSelect;
    if (tipo === 'resenas') {
      const where = { usuarioId };
      const [datos, total] = await Promise.all([
        this.prisma.resena.findMany({
          where,
          ...paginacion,
          orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            comentario: true,
            calificacion: true,
            creadoEn: true,
            puntoInteres: { select: lugarSelect },
          },
        }),
        this.prisma.resena.count({ where }),
      ]);
      return { datos, total, pagina, limite };
    }
    if (tipo === 'lugares') {
      const where = { propietarioId: usuarioId, estado: 'ACTIVO' as const };
      const [datos, total] = await Promise.all([
        this.prisma.puntoInteres.findMany({
          where,
          ...paginacion,
          orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
          select: lugarSelect,
        }),
        this.prisma.puntoInteres.count({ where }),
      ]);
      return {
        datos: datos.map((puntoInteres) => ({
          id: puntoInteres.id,
          puntoInteres,
        })),
        total,
        pagina,
        limite,
      };
    }
    const where = { usuarioId };
    const [datos, total] = await Promise.all([
      this.prisma.favorito.findMany({
        where,
        ...paginacion,
        orderBy: [{ agregadoEn: 'desc' }, { puntoInteresId: 'desc' }],
        select: {
          puntoInteresId: true,
          puntoInteres: { select: lugarSelect },
        },
      }),
      this.prisma.favorito.count({ where }),
    ]);
    return {
      datos: datos.map(({ puntoInteresId, ...item }) => ({
        id: puntoInteresId,
        ...item,
      })),
      total,
      pagina,
      limite,
    };
  }

  async actualizarPerfil(usuarioId: number, datos: ActualizarPerfilDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, activo: true },
    });
    if (!usuario?.activo) throw new ForbiddenException('Usuario inactivo');

    try {
      await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          ...datos,
          ...(datos.fechaNacimiento
            ? { fechaNacimiento: new Date(datos.fechaNacimiento) }
            : {}),
        },
        select: publicUserSelect,
      });
      return this.obtenerPerfil(usuarioId);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('El correo ya está registrado');
      }
      throw error;
    }
  }

  async cambiarPassword(usuarioId: number, datos: CambiarPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { passwordHash: true, activo: true },
    });
    if (
      !usuario?.activo ||
      !(await compare(datos.passwordActual, usuario.passwordHash))
    ) {
      throw new UnauthorizedException('La contraseña actual no es válida');
    }

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { passwordHash: await hash(datos.passwordNueva, 12) },
      }),
      this.prisma.refreshToken.updateMany({
        where: { usuarioId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      }),
    ]);
    return { message: 'Contraseña actualizada correctamente' };
  }

  listarAdministracion() {
    return this.prisma.usuario.findMany({
      orderBy: { creadoEn: 'desc' },
      select: publicUserSelect,
    });
  }

  async administrar(
    administradorId: number,
    usuarioId: number,
    datos: AdministrarUsuarioDto,
  ) {
    if (administradorId === usuarioId && datos.activo === false) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }

    const existente = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, rol: true, tipoCuenta: true, ruc: true },
    });
    if (!existente) throw new NotFoundException('El usuario no existe');

    if (
      datos.proveedorVerificado &&
      existente.tipoCuenta !== 'PRESTADOR_TURISTICO'
    ) {
      throw new ForbiddenException(
        'Solo se pueden verificar cuentas de prestadores turísticos',
      );
    }
    if (
      datos.proveedorVerificado === true &&
      (!existente.ruc || !esRucEcuatorianoValido(existente.ruc))
    ) {
      throw new ForbiddenException(
        'El prestador necesita un RUC ecuatoriano válido',
      );
    }

    const data = {
      ...datos,
      ...(datos.proveedorVerificado === true
        ? {
            estadoVerificacion: 'APROBADO' as const,
            rol: 'PROVEEDOR' as const,
            verificadoEn: new Date(),
            motivoRechazo: null,
          }
        : {}),
      ...(datos.proveedorVerificado === false
        ? {
            estadoVerificacion: 'RECHAZADO' as const,
            verificadoEn: null,
          }
        : {}),
    };

    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data,
      select: publicUserSelect,
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
