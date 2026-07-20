import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface PointCreatedJobData {
  puntoId: number;
  nombre: string;
  direccion: string;
  usuarioId: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
  ) {}

  async addPointCreatedJob(data: PointCreatedJobData) {
    const job = await this.notificationsQueue.add(
      'point-created',
      data,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    console.log(
      `📨 Trabajo agregado a BullMQ. Job ID: ${job.id}`,
    );

    return job;
  }
}