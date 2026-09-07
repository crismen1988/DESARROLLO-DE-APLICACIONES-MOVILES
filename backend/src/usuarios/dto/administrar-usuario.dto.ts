import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class AdministrarUsuarioDto {
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  proveedorVerificado?: boolean;
}
