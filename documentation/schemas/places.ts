// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreatePlaceRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['attraction', 'restaurant', 'accommodation', 'service'], {
    errorMap: () => ({ message: 'Tipo de lugar inválido' }),
  }),
  address: z.string().min(1, 'La dirección es requerida'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, 'Latitud inválida'),
    lng: z.number().min(-180).max(180, 'Longitud inválida'),
  }),
  phone: z.string().regex(/^[+]?[0-9\s-()]+$/).optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  website: z.string().url('URL inválida').optional(),
  openingHours: z.string().optional(),
  priceRange: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  organizationId: z.string().uuid('ID de organización inválido'),
  sedeId: z.string().uuid('ID de sede inválido'),
});

const UpdatePlaceRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().min(1, 'La descripción es requerida').optional(),
  type: z.enum(['attraction', 'restaurant', 'accommodation', 'service'], {
    errorMap: () => ({ message: 'Tipo de lugar inválido' }),
  }).optional(),
  address: z.string().min(1, 'La dirección es requerida').optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, 'Latitud inválida'),
    lng: z.number().min(-180).max(180, 'Longitud inválida'),
  }).optional(),
  phone: z.string().regex(/^[+]?[0-9\s-()]+$/).optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  website: z.string().url('URL inválida').optional(),
  openingHours: z.string().optional(),
  priceRange: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
});

// Schemas de salida
const PlaceResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['attraction', 'restaurant', 'accommodation', 'service']),
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  openingHours: z.string().optional(),
  priceRange: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  organizationId: z.string().uuid(),
  sedeId: z.string().uuid(),
});

const PlaceListResponse = z.object({
  data: z.array(PlaceResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreatePlaceRequest', CreatePlaceRequest);
registry.registerComponent('schemas', 'UpdatePlaceRequest', UpdatePlaceRequest);
registry.registerComponent('schemas', 'PlaceResponse', PlaceResponse);
registry.registerComponent('schemas', 'PlaceListResponse', PlaceListResponse);

// Endpoints
registry.registerPath({
  path: '/places',
  method: 'get',
  options: {
    summary: 'Listar lugares',
    description: 'Obtiene una lista paginada de lugares',
    tags: ['Lugares'],
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
        schema: { type: 'string', enum: ['attraction', 'restaurant', 'accommodation', 'service'] },
      },
      {
        name: 'search',
        in: 'query',
        description: 'Término de búsqueda',
        required: false,
        schema: { type: 'string' },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de lugares obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PlaceListResponse' },
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
  path: '/places',
  method: 'post',
  options: {
    summary: 'Crear lugar',
    description: 'Crea un nuevo lugar',
    tags: ['Lugares'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreatePlaceRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Lugar creado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PlaceResponse' },
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
  path: '/places/{placeId}',
  method: 'get',
  options: {
    summary: 'Obtener lugar por ID',
    description: 'Obtiene un lugar específico por su ID',
    tags: ['Lugares'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'placeId',
        in: 'path',
        description: 'ID del lugar',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Lugar obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PlaceResponse' },
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
        description: 'Lugar no encontrado',
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
  path: '/places/{placeId}',
  method: 'patch',
  options: {
    summary: 'Actualizar lugar',
    description: 'Actualiza un lugar existente',
    tags: ['Lugares'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'placeId',
        in: 'path',
        description: 'ID del lugar',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdatePlaceRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Lugar actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PlaceResponse' },
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
        description: 'Lugar no encontrado',
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
  path: '/places/{placeId}',
  method: 'delete',
  options: {
    summary: 'Eliminar lugar',
    description: 'Elimina un lugar',
    tags: ['Lugares'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'placeId',
        in: 'path',
        description: 'ID del lugar',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Lugar eliminado exitosamente',
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
        description: 'Lugar no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});