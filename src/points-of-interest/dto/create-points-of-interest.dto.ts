export class CreatePointsOfInterestDto {
  nombre: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  categoriaId: number;
  usuarioId: number;
}
