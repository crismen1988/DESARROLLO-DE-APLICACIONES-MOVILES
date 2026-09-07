import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Rol } from '../generated/prisma/enums';
import { TipoCuenta } from '../generated/prisma/enums';
import { esRucEcuatorianoValido } from './ruc.validator';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly refreshTokenDurationMs = 7 * 24 * 60 * 60 * 1000;
  private readonly passwordResetDurationMs = 15 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async registrar(
    correo: string,
    nombre: string,
    password: string,
    tipoCuenta: TipoCuenta = TipoCuenta.TURISTA,
    ruc?: string,
    datosProveedor?: {
      razonSocial?: string;
      nombreComercial?: string;
      telefono?: string;
      direccion?: string;
      ciudad?: string;
      actividadTuristica?: string;
      sitioWeb?: string;
    },
  ) {
    correo = correo.trim().toLowerCase();
    nombre = nombre.trim();
    const rucNormalizado = ruc?.trim();
    if (tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO) {
      if (!rucNormalizado || !esRucEcuatorianoValido(rucNormalizado)) {
        throw new BadRequestException('El RUC ecuatoriano no es válido');
      }
    } else if (rucNormalizado) {
      throw new BadRequestException(
        'El RUC solo corresponde a prestadores turísticos',
      );
    }

    if (tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO) {
      const camposRequeridos = [
        datosProveedor?.razonSocial,
        datosProveedor?.nombreComercial,
        datosProveedor?.telefono,
        datosProveedor?.direccion,
        datosProveedor?.ciudad,
        datosProveedor?.actividadTuristica,
      ];
      if (camposRequeridos.some((campo) => !campo?.trim())) {
        throw new BadRequestException(
          'Completa la información comercial y de contacto del proveedor',
        );
      }
    }

    const existente = await this.prisma.usuario.findUnique({
      where: { correo },
    });
    if (existente) throw new ConflictException('El correo ya está registrado');

    const usuario = await this.prisma.usuario.create({
      data: {
        correo,
        nombre,
        passwordHash: await hash(password, 12),
        rol:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? 'PROVEEDOR'
            : 'TURISTA',
        tipoCuenta,
        ruc: rucNormalizado,
        estadoVerificacion:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? 'PENDIENTE'
            : 'NO_APLICA',
        proveedorVerificado: false,
        razonSocial:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.razonSocial?.trim()
            : undefined,
        nombreComercial:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.nombreComercial?.trim()
            : undefined,
        telefono:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.telefono?.trim()
            : undefined,
        direccion:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.direccion?.trim()
            : undefined,
        ciudad:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.ciudad?.trim()
            : undefined,
        actividadTuristica:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.actividadTuristica?.trim()
            : undefined,
        sitioWeb:
          tipoCuenta === TipoCuenta.PRESTADOR_TURISTICO
            ? datosProveedor?.sitioWeb?.trim()
            : undefined,
      },
      select: { id: true, correo: true, nombre: true, rol: true },
    });
    return this.crearRespuesta(usuario);
  }

  async iniciarSesion(correo: string, password: string) {
    correo = correo.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    if (
      !usuario ||
      !usuario.activo ||
      !(await compare(password, usuario.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return this.crearRespuesta({
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });
  }

  async solicitarRestablecimiento(correo: string): Promise<void> {
    const correoNormalizado = correo.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
      select: { id: true, correo: true, activo: true },
    });

    // La respuesta del endpoint es siempre la misma para evitar enumerar cuentas.
    if (!usuario?.activo) return;

    const token = randomBytes(48).toString('base64url');
    const tokenHash = this.hashRefreshToken(token);
    const expiraEn = new Date(Date.now() + this.passwordResetDurationMs);
    const baseUrl = process.env.PASSWORD_RESET_URL;
    if (!baseUrl) {
      console.error('PASSWORD_RESET_URL no está configurada');
      return;
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { usuarioId: usuario.id, usadoEn: null },
      data: { usadoEn: new Date() },
    });
    await this.prisma.passwordResetToken.create({
      data: { tokenHash, usuarioId: usuario.id, expiraEn },
    });

    try {
      const enlace = `${baseUrl}?token=${encodeURIComponent(token)}`;
      await this.mail.enviarEnlaceRestablecimiento(usuario.correo, enlace);
    } catch (error) {
      await this.prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      console.error('No se pudo enviar el correo de recuperación', error);
    }
  }

  async restablecerPassword(
    token: string,
    passwordNueva: string,
  ): Promise<void> {
    const tokenHash = this.hashRefreshToken(token);
    const ahora = new Date();
    const registro = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, usuarioId: true, expiraEn: true, usadoEn: true },
    });

    if (!registro || registro.usadoEn || registro.expiraEn <= ahora) {
      throw new UnauthorizedException(
        'El enlace de recuperación no es válido o ya expiró',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const consumido = await transaction.passwordResetToken.updateMany({
        where: { id: registro.id, usadoEn: null, expiraEn: { gt: ahora } },
        data: { usadoEn: ahora },
      });
      if (consumido.count !== 1) {
        throw new UnauthorizedException(
          'El enlace de recuperación no es válido o ya expiró',
        );
      }

      await transaction.usuario.update({
        where: { id: registro.usuarioId, activo: true },
        data: { passwordHash: await hash(passwordNueva, 12) },
      });
      await transaction.refreshToken.updateMany({
        where: { usuarioId: registro.usuarioId, revocadoEn: null },
        data: { revocadoEn: ahora },
      });
    });
  }

  async refrescar(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });

    if (
      !storedToken ||
      storedToken.revocadoEn ||
      storedToken.expiraEn <= new Date() ||
      !storedToken.usuario.activo
    ) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const nextRefreshToken = this.generateRefreshToken();
    const nextTokenHash = this.hashRefreshToken(nextRefreshToken);
    const nextExpiration = new Date(Date.now() + this.refreshTokenDurationMs);

    await this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: { id: storedToken.id, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      await transaction.refreshToken.create({
        data: {
          tokenHash: nextTokenHash,
          usuarioId: storedToken.usuarioId,
          expiraEn: nextExpiration,
        },
      });
    });

    return {
      usuario: this.usuarioPublico(storedToken.usuario),
      accessToken: await this.crearToken(storedToken.usuario),
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt: nextExpiration.toISOString(),
    };
  }

  async cerrarSesion(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashRefreshToken(refreshToken),
        revocadoEn: null,
      },
      data: { revocadoEn: new Date() },
    });
  }

  private async crearRespuesta(usuario: {
    id: number;
    correo: string;
    nombre: string;
    rol: Rol;
  }) {
    const refreshToken = this.generateRefreshToken();
    const expiraEn = new Date(Date.now() + this.refreshTokenDurationMs);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashRefreshToken(refreshToken),
        usuarioId: usuario.id,
        expiraEn,
      },
    });

    return {
      usuario: this.usuarioPublico(usuario),
      accessToken: await this.crearToken(usuario),
      refreshToken,
      refreshTokenExpiresAt: expiraEn.toISOString(),
    };
  }

  private usuarioPublico(usuario: {
    id: number;
    correo: string;
    nombre: string;
    rol: Rol;
  }) {
    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private crearToken(usuario: { id: number; correo: string; rol: Rol }) {
    return this.jwt.signAsync({
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });
  }
}
