import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearPuntoInteresDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccion?: string;

  @Type(() => Number)
  @IsNumber()
  latitud!: number;

  @Type(() => Number)
  @IsNumber()
  longitud!: number;

  @Type(() => Number)
  @IsInt()
  categoriaId!: number;
}
