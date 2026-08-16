import { Rol } from '../generated/prisma/enums';

export interface JwtPayload {
  sub: number;
  correo: string;
  rol: Rol;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
