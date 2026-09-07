import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthGuard', () => {
  it('rechaza tokens de usuarios inactivos', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({ sub: 7 }),
    } as unknown as JwtService;
    const prisma = {
      usuario: { findUnique: jest.fn().mockResolvedValue({ activo: false }) },
    } as unknown as PrismaService;
    const guard = new AuthGuard(jwt, prisma);
    const request = { headers: { authorization: 'Bearer token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza peticiones sin token', async () => {
    const jwt = {} as JwtService;
    const prisma = {} as PrismaService;
    const guard = new AuthGuard(jwt, prisma);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    } as never;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
