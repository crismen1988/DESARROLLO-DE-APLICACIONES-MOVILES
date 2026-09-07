import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  IsDateString,
  IsInt,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)
  fotoPerfil?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  edad?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  paisOrigen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccion?: string;
}
