import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ActividadPerfilDto {
  @IsOptional()
  @IsIn(['favoritos', 'resenas', 'lugares'])
  tipo: 'favoritos' | 'resenas' | 'lugares' = 'favoritos';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  pagina = 1;
}
