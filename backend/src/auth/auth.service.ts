import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { Rol } from '../generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(correo: string, nombre: string, password: string) {
    const existente = await this.prisma.usuario.findUnique({
      where: { correo },
    });
    if (existente) throw new ConflictException('El correo ya está registrado');

    const usuario = await this.prisma.usuario.create({
      data: { correo, nombre, passwordHash: await hash(password, 10) },
      select: { id: true, correo: true, nombre: true, rol: true },
    });
    return { usuario, accessToken: await this.crearToken(usuario) };
  }

  async iniciarSesion(correo: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    if (
      !usuario ||
      !usuario.activo ||
      !(await compare(password, usuario.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return {
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
      accessToken: await this.crearToken(usuario),
    };
  }

  private crearToken(usuario: { id: number; correo: string; rol: Rol }) {
    return this.jwt.signAsync({
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });
  }
}
