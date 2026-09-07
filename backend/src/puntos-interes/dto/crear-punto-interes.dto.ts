import { Type } from 'class-transformer';
import {
  IsInt,
  IsLatitude,
  IsNotEmpty,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
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
  @IsLatitude()
  latitud!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitud!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoriaId!: number;
}
