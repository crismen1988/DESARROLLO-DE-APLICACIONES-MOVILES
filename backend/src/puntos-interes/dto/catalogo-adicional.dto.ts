import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DiaSemana } from '../../generated/prisma/enums';

export class HorarioDto {
  @IsEnum(DiaSemana)
  dia!: DiaSemana;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  apertura!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  cierre!: string;
}

export class ImagenDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  textoAlternativo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  orden?: number;
}

export class ContactoDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  sitioWeb?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactoEmergencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoEmergencia?: string;
}
