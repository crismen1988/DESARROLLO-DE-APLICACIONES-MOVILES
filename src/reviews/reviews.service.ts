import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createReviewDto: CreateReviewDto) {
    return this.prisma.resena.create({
      data: createReviewDto,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        punto: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.resena.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        punto: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.resena.findUnique({
      where: { id },
      include: {
        usuario: true,
        punto: true,
      },
    });
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return this.prisma.resena.update({
      where: { id },
      data: updateReviewDto,
    });
  }

  remove(id: number) {
    return this.prisma.resena.delete({
      where: { id },
    });
  }
}