import { IsEnum } from 'class-validator';
import { EstadoReporte } from '../../generated/prisma/enums';

export class ActualizarReporteDto {
  @IsEnum(EstadoReporte)
  estado!: EstadoReporte;
}
