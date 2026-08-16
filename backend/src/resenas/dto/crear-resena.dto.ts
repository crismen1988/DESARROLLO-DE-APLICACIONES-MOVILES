import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class CrearResenaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;

  @Type(() => Number)
  @IsInt()
  puntoInteresId!: number;
}
