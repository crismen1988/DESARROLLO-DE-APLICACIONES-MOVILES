// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateSystemConfigRequest = z.object({
  key: z.string().min(1, 'La clave es requerida'),
  value: z.string().min(1, 'El valor es requerido'),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const UpdateSystemConfigRequest = z.object({
  key: z.string().min(1, 'La clave es requerida').optional(),
  value: z.string().min(1, 'El valor es requerido').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Schemas de salida
const SystemConfigResponse = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const SystemConfigListResponse = z.object({
  data: z.array(SystemConfigResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateSystemConfigRequest', CreateSystemConfigRequest);
registry.registerComponent('schemas', 'UpdateSystemConfigRequest', UpdateSystemConfigRequest);
registry.registerComponent('schemas', 'SystemConfigResponse', SystemConfigResponse);
registry.registerComponent('schemas', 'SystemConfigListResponse', SystemConfigListResponse);

// Endpoints
registry.registerPath({
  path: '/system/config',
  method: 'get',
  options: {
    summary: 'Listar configuraciones del sistema',
    description: 'Obtiene una lista paginada de configuraciones del sistema',
    tags: ['Sistema'],
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
        name: 'category',
        in: 'query',
        description: 'Filtrar por categoría',
        required: false,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de configuraciones obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SystemConfigListResponse' },
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
  path: '/system/config',
  method: 'post',
  options: {
    summary: 'Crear configuración del sistema',
    description: 'Crea una nueva configuración del sistema',
    tags: ['Sistema'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateSystemConfigRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Configuración creada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SystemConfigResponse' },
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
    },
  },
});

registry.registerPath({
  path: '/system/config/{configId}',
  method: 'get',
  options: {
    summary: 'Obtener configuración por ID',
    description: 'Obtiene una configuración específica por su ID',
    tags: ['Sistema'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'configId',
        in: 'path',
        description: 'ID de la configuración',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Configuración obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SystemConfigResponse' },
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
        description: 'Configuración no encontrada',
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
  path: '/system/config/{configId}',
  method: 'patch',
  options: {
    summary: 'Actualizar configuración',
    description: 'Actualiza una configuración existente',
    tags: ['Sistema'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'configId',
        in: 'path',
        description: 'ID de la configuración',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateSystemConfigRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Configuración actualizada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SystemConfigResponse' },
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
        description: 'Configuración no encontrada',
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
  path: '/system/config/{configId}',
  method: 'delete',
  options: {
    summary: 'Eliminar configuración',
    description: 'Elimina una configuración',
    tags: ['Sistema'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'configId',
        in: 'path',
        description: 'ID de la configuración',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Configuración eliminada exitosamente',
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
        description: 'Configuración no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});