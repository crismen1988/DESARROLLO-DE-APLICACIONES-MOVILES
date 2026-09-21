// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateTourRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.number().positive('El precio debe ser positivo'),
  duration: z.number().int().positive('La duración debe ser un número entero positivo'),
  capacity: z.number().int().positive('La capacidad debe ser un número entero positivo'),
  startDate: z.string().datetime({ offset: true }, 'Fecha de inicio inválida'),
  endDate: z.string().datetime({ offset: true }, 'Fecha de fin inválida'),
  location: z.string().min(1, 'La ubicación es requerida'),
  images: z.array(z.string().url()).optional(),
  includedServices: z.array(z.string()).optional(),
});

const UpdateTourRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().min(1, 'La descripción es requerida').optional(),
  price: z.number().positive('El precio debe ser positivo').optional(),
  duration: z.number().int().positive('La duración debe ser un número entero positivo').optional(),
  capacity: z.number().int().positive('La capacidad debe ser un número entero positivo').optional(),
  startDate: z.string().datetime({ offset: true }, 'Fecha de inicio inválida').optional(),
  endDate: z.string().datetime({ offset: true }, 'Fecha de fin inválida').optional(),
  location: z.string().min(1, 'La ubicación es requerida').optional(),
  images: z.array(z.string().url()).optional(),
  includedServices: z.array(z.string()).optional(),
});

// Schemas de salida
const TourResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  duration: z.number().int(),
  capacity: z.number().int(),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
  location: z.string(),
  images: z.array(z.string().url()).optional(),
  includedServices: z.array(z.string()).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  organizationId: z.string().uuid(),
  sedeId: z.string().uuid(),
});

const TourListResponse = z.object({
  data: z.array(TourResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateTourRequest', CreateTourRequest);
registry.registerComponent('schemas', 'UpdateTourRequest', UpdateTourRequest);
registry.registerComponent('schemas', 'TourResponse', TourResponse);
registry.registerComponent('schemas', 'TourListResponse', TourListResponse);

// Endpoints
registry.registerPath({
  path: '/tours',
  method: 'get',
  options: {
    summary: 'Listar tours',
    description: 'Obtiene una lista paginada de tours',
    tags: ['Tours'],
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
        name: 'search',
        in: 'query',
        description: 'Término de búsqueda',
        required: false,
        schema: { type: 'string' },
      },
      {
        name: 'location',
        in: 'query',
        description: 'Filtrar por ubicación',
        required: false,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de tours obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TourListResponse' },
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
  path: '/tours',
  method: 'post',
  options: {
    summary: 'Crear tour',
    description: 'Crea un nuevo tour',
    tags: ['Tours'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateTourRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Tour creado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TourResponse' },
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
  path: '/tours/{tourId}',
  method: 'get',
  options: {
    summary: 'Obtener tour por ID',
    description: 'Obtiene un tour específico por su ID',
    tags: ['Tours'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'tourId',
        in: 'path',
        description: 'ID del tour',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Tour obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TourResponse' },
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
        description: 'Tour no encontrado',
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
  path: '/tours/{tourId}',
  method: 'patch',
  options: {
    summary: 'Actualizar tour',
    description: 'Actualiza un tour existente',
    tags: ['Tours'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'tourId',
        in: 'path',
        description: 'ID del tour',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateTourRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Tour actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TourResponse' },
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
        description: 'Tour no encontrado',
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
  path: '/tours/{tourId}',
  method: 'delete',
  options: {
    summary: 'Eliminar tour',
    description: 'Elimina un tour',
    tags: ['Tours'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'tourId',
        in: 'path',
        description: 'ID del tour',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Tour eliminado exitosamente',
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
        description: 'Tour no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});