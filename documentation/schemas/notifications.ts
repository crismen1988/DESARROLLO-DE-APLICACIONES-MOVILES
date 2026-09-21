// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateNotificationRequest = z.object({
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  type: z.enum(['info', 'success', 'warning', 'error'], {
    errorMap: () => ({ message: 'Tipo de notificación inválido' }),
  }),
  data: z.record(z.any()).optional(),
  recipientIds: z.array(z.string().uuid('ID de usuario inválido')).min(1, 'Debe haber al menos un destinatario'),
});

const UpdateNotificationRequest = z.object({
  title: z.string().min(1, 'El título es requerido').optional(),
  message: z.string().min(1, 'El mensaje es requerido').optional(),
  type: z.enum(['info', 'success', 'warning', 'error'], {
    errorMap: () => ({ message: 'Tipo de notificación inválido' }),
  }).optional(),
  data: z.record(z.any()).optional(),
  read: z.boolean().optional(),
});

// Schemas de salida
const NotificationResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']),
  data: z.record(z.any()).optional(),
  recipientId: z.string().uuid(),
  read: z.boolean(),
  readAt: z.string().datetime({ offset: true }).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const NotificationListResponse = z.object({
  data: z.array(NotificationResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateNotificationRequest', CreateNotificationRequest);
registry.registerComponent('schemas', 'UpdateNotificationRequest', UpdateNotificationRequest);
registry.registerComponent('schemas', 'NotificationResponse', NotificationResponse);
registry.registerComponent('schemas', 'NotificationListResponse', NotificationListResponse);

// Endpoints
registry.registerPath({
  path: '/notifications',
  method: 'get',
  options: {
    summary: 'Listar notificaciones',
    description: 'Obtiene una lista paginada de notificaciones',
    tags: ['Notificaciones'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'page',
        in: 'query',
        description: 'Número de página',
        required: false,
        schema: { type: 'integer', default: 1, minimum: 1 },
      },
      {
        name: 'pageSize',
        in: 'query',
        description: 'Tamaño de página',
        required: false,
        schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
      },
      {
        name: 'read',
        in: 'query',
        description: 'Filtrar por estado de lectura',
        required: false,
        schema: { type: 'boolean' },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de notificaciones obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotificationListResponse' },
          },
        },
      },
      '401': {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});

registry.registerPath({
  path: '/notifications',
  method: 'post',
  options: {
    summary: 'Crear notificación',
    description: 'Crea una nueva notificación',
    tags: ['Notificaciones'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateNotificationRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Notificación creada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotificationResponse' },
          },
        },
      },
      '400': {
        description: 'Solicitud inválida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '401': {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});

registry.registerPath({
  path: '/notifications/{notificationId}',
  method: 'get',
  options: {
    summary: 'Obtener notificación por ID',
    description: 'Obtiene una notificación específica por su ID',
    tags: ['Notificaciones'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'notificationId',
        in: 'path',
        description: 'ID de la notificación',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Notificación obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotificationResponse' },
          },
        },
      },
      '401': {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '404': {
        description: 'Notificación no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});

registry.registerPath({
  path: '/notifications/{notificationId}',
  method: 'patch',
  options: {
    summary: 'Actualizar notificación',
    description: 'Actualiza una notificación existente',
    tags: ['Notificaciones'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'notificationId',
        in: 'path',
        description: 'ID de la notificación',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateNotificationRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Notificación actualizada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotificationResponse' },
          },
        },
      },
      '400': {
        description: 'Solicitud inválida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '401': {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '403': {
        description: 'Prohibido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '404': {
        description: 'Notificación no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});

registry.registerPath({
  path: '/notifications/{notificationId}',
  method: 'delete',
  options: {
    summary: 'Eliminar notificación',
    description: 'Elimina una notificación',
    tags: ['Notificaciones'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'notificationId',
        in: 'path',
        description: 'ID de la notificación',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Notificación eliminada exitosamente',
      },
      '401': {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '403': {
        description: 'Prohibido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '404': {
        description: 'Notificación no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});