import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearReporteDto {
  @IsInt()
  @Min(1)
  puntoInteresId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  motivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
