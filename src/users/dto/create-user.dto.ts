import { Rol } from '@prisma/client';

export class CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
}