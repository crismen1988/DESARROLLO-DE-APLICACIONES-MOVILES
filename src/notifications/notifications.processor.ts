import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PointCreatedJobData } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  async process(
    job: Job<PointCreatedJobData>,
  ): Promise<Record<string, unknown>> {
    console.log(
      `⚙️ Worker procesando trabajo ${job.id}: ${job.name}`,
    );

    switch (job.name) {
      case 'point-created':
        return this.processPointCreated(job);

      default:
        throw new Error(
          `Tipo de trabajo no reconocido: ${job.name}`,
        );
    }
  }

  private async processPointCreated(
    job: Job<PointCreatedJobData>,
  ): Promise<Record<string, unknown>> {
    const { puntoId, nombre, direccion, usuarioId } = job.data;

    /*
     * Simulamos una operación externa o costosa.
     * En un sistema real podría ser:
     * - enviar un correo;
     * - enviar una notificación;
     * - generar un reporte;
     * - actualizar estadísticas.
     */
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 3000);
    });

    console.log('🔔 Notificación procesada');
    console.log(`   Punto: ${nombre}`);
    console.log(`   Dirección: ${direccion}`);
    console.log(`   Usuario: ${usuarioId}`);

    return {
      processed: true,
      puntoId,
      message: `Notificación del punto "${nombre}" procesada`,
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(
      `✅ Trabajo ${job.id} completado correctamente`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    console.error(
      `❌ Trabajo ${job?.id ?? 'desconocido'} falló:`,
      error.message,
    );
  }
}