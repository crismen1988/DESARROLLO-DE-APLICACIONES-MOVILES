// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateMessageRequest = z.object({
  content: z.string().min(1, 'El contenido es requerido'),
  type: z.enum(['text', 'image', 'audio', 'video'], {
    errorMap: () => ({ message: 'Tipo de mensaje inválido' }),
  }),
  attachments: z.array(z.string().url()).optional(),
  replyTo: z.string().uuid('ID de mensaje inválido').optional(),
});

const UpdateMessageRequest = z.object({
  content: z.string().min(1, 'El contenido es requerido').optional(),
  type: z.enum(['text', 'image', 'audio', 'video'], {
    errorMap: () => ({ message: 'Tipo de mensaje inválido' }),
  }).optional(),
  attachments: z.array(z.string().url()).optional(),
});

// Schemas de salida
const MessageResponse = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  senderName: z.string(),
  recipientId: z.string().uuid(),
  conversationId: z.string().uuid(),
  content: z.string(),
  type: z.enum(['text', 'image', 'audio', 'video']),
  attachments: z.array(z.string().url()).optional(),
  replyTo: z.string().uuid().optional(),
  read: z.boolean(),
  readAt: z.string().datetime({ offset: true }).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const MessageListResponse = z.object({
  data: z.array(MessageResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateMessageRequest', CreateMessageRequest);
registry.registerComponent('schemas', 'UpdateMessageRequest', UpdateMessageRequest);
registry.registerComponent('schemas', 'MessageResponse', MessageResponse);
registry.registerComponent('schemas', 'MessageListResponse', MessageListResponse);

// Endpoints
registry.registerPath({
  path: '/chat/messages',
  method: 'get',
  options: {
    summary: 'Listar mensajes',
    description: 'Obtiene una lista paginada de mensajes',
    tags: ['Chat'],
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
        name: 'conversationId',
        in: 'query',
        description: 'ID de conversación',
        required: false,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de mensajes obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageListResponse' },
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
  path: '/chat/messages',
  method: 'post',
  options: {
    summary: 'Crear mensaje',
    description: 'Crea un nuevo mensaje',
    tags: ['Chat'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateMessageRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Mensaje creado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
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
  path: '/chat/messages/{messageId}',
  method: 'get',
  options: {
    summary: 'Obtener mensaje por ID',
    description: 'Obtiene un mensaje específico por su ID',
    tags: ['Chat'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'messageId',
        in: 'path',
        description: 'ID del mensaje',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Mensaje obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
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
        description: 'Mensaje no encontrado',
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
  path: '/chat/messages/{messageId}',
  method: 'patch',
  options: {
    summary: 'Actualizar mensaje',
    description: 'Actualiza un mensaje existente',
    tags: ['Chat'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'messageId',
        in: 'path',
        description: 'ID del mensaje',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateMessageRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Mensaje actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
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
        description: 'Mensaje no encontrado',
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
  path: '/chat/messages/{messageId}',
  method: 'delete',
  options: {
    summary: 'Eliminar mensaje',
    description: 'Elimina un mensaje',
    tags: ['Chat'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'messageId',
        in: 'path',
        description: 'ID del mensaje',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Mensaje eliminado exitosamente',
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
        description: 'Mensaje no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});