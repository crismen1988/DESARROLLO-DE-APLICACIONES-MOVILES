import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';

type NotificacionJob = { usuarioId: number; titulo: string; mensaje: string };

@Injectable()
export class NotificacionesService implements OnModuleInit, OnModuleDestroy {
  private readonly queue = new Queue<NotificacionJob>('notificaciones', {
    connection: this.redisConnection(),
  });
  private worker?: Worker<NotificacionJob>;

  async encolar(datos: NotificacionJob) {
    return this.queue.add('enviar-notificacion', datos, {
      removeOnComplete: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  onModuleInit() {
    this.worker = new Worker<NotificacionJob>(
      'notificaciones',
      async (job: Job<NotificacionJob>) => {
        // En producción este punto integrará FCM/APNs.
        console.log(`[worker] Notificación procesada: ${job.data.titulo}`);
        await Promise.resolve();
      },
      { connection: this.redisConnection() },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
  }

  private redisConnection() {
    const url = new URL(
      process.env.REDIS_URL ??
        `redis://localhost:${process.env.REDIS_PORT ?? '6380'}`,
    );
    return { host: url.hostname, port: Number(url.port || 6379) };
  }
}
