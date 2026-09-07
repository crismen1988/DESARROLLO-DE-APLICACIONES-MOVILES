import { IsEmail, MaxLength } from 'class-validator';

export class SolicitarRestablecimientoDto {
  @IsEmail()
  @MaxLength(180)
  correo!: string;
}
