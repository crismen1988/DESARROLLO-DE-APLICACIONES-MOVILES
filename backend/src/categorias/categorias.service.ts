import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  obtenerTodas() {
    return this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async buscarPorId(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException(`No existe una categoría con el id ${id}`);
    }

    return categoria;
  }

  crear(datos: CrearCategoriaDto) {
    return this.prisma.categoria.create({
      data: datos,
    });
  }

  eliminar(id: number) {
    return this.prisma.categoria.delete({
      where: {
        id,
      },
    });
  }

  actualizar(id: number, datos: ActualizarCategoriaDto) {
    return this.prisma.categoria.update({
      where: {
        id,
      },
      data: datos,
    });
  }
}
