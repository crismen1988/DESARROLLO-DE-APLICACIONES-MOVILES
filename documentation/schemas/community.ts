// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateCommunityRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['group', 'forum', 'event', 'discussion'], {
    errorMap: () => ({ message: 'Tipo de comunidad inválido' }),
  }),
  organizationId: z.string().uuid('ID de organización inválido'),
  sedeId: z.string().uuid('ID de sede inválido'),
  createdBy: z.string().uuid('ID de creador inválido'),
});

const UpdateCommunityRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().min(1, 'La descripción es requerida').optional(),
  type: z.enum(['group', 'forum', 'event', 'discussion'], {
    errorMap: () => ({ message: 'Tipo de comunidad inválido' }),
  }).optional(),
  organizationId: z.string().uuid('ID de organización inválido').optional(),
  sedeId: z.string().uuid('ID de sede inválido').optional(),
});

// Schemas de salida
const CommunityResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['group', 'forum', 'event', 'discussion']),
  organizationId: z.string().uuid(),
  sedeId: z.string().uuid(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const CommunityListResponse = z.object({
  data: z.array(CommunityResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateCommunityRequest', CreateCommunityRequest);
registry.registerComponent('schemas', 'UpdateCommunityRequest', UpdateCommunityRequest);
registry.registerComponent('schemas', 'CommunityResponse', CommunityResponse);
registry.registerComponent('schemas', 'CommunityListResponse', CommunityListResponse);

// Endpoints
registry.registerPath({
  path: '/community',
  method: 'get',
  options: {
    summary: 'Listar comunidades',
    description: 'Obtiene una lista paginada de comunidades',
    tags: ['Comunidad'],
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
        name: 'type',
        in: 'query',
        description: 'Filtrar por tipo',
        required: false,
        schema: { type: 'string', enum: ['group', 'forum', 'event', 'discussion'] },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de comunidades obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CommunityListResponse' },
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
  path: '/community',
  method: 'post',
  options: {
    summary: 'Crear comunidad',
    description: 'Crea una nueva comunidad',
    tags: ['Comunidad'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateCommunityRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Comunidad creada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CommunityResponse' },
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
  path: '/community/{communityId}',
  method: 'get',
  options: {
    summary: 'Obtener comunidad por ID',
    description: 'Obtiene una comunidad específica por su ID',
    tags: ['Comunidad'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'communityId',
        in: 'path',
        description: 'ID de la comunidad',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Comunidad obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CommunityResponse' },
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
        description: 'Comunidad no encontrada',
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
  path: '/community/{communityId}',
  method: 'patch',
  options: {
    summary: 'Actualizar comunidad',
    description: 'Actualiza una comunidad existente',
    tags: ['Comunidad'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'communityId',
        in: 'path',
        description: 'ID de la comunidad',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateCommunityRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Comunidad actualizada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CommunityResponse' },
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
        description: 'Comunidad no encontrada',
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
  path: '/community/{communityId}',
  method: 'delete',
  options: {
    summary: 'Eliminar comunidad',
    description: 'Elimina una comunidad',
    tags: ['Comunidad'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'communityId',
        in: 'path',
        description: 'ID de la comunidad',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Comunidad eliminada exitosamente',
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
        description: 'Comunidad no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});