// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateOrganizationRequest = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  website: z.string().url('URL de sitio web inválida').optional(),
});

const UpdateOrganizationRequest = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  website: z.string().url('URL de sitio web inválida').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

const CreateSedeRequest = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  address: z.string().optional(),
  phone: z.string().optional(),
  capacity: z.number().int().min(1, 'La capacidad debe ser al menos 1').optional(),
  isOpen: z.boolean().optional(),
});

const UpdateSedeRequest = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  capacity: z.number().int().min(1, 'La capacidad debe ser al menos 1').optional(),
  isOpen: z.boolean().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

const OrganizationQueryParams = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  pageSize: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// Schemas de salida
const OrganizationResponse = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  venuesCount: z.number(),
});

const SedeResponse = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  capacity: z.number().int(),
  currentBooked: z.number().int(),
  isOpen: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const OrganizationListResponse = z.object({
  data: z.array(OrganizationResponse),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  }),
});

const SedeListResponse = z.object({
  data: z.array(SedeResponse),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  }),
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateOrganizationRequest', CreateOrganizationRequest);
registry.registerComponent('schemas', 'UpdateOrganizationRequest', UpdateOrganizationRequest);
registry.registerComponent('schemas', 'CreateSedeRequest', CreateSedeRequest);
registry.registerComponent('schemas', 'UpdateSedeRequest', UpdateSedeRequest);
registry.registerComponent('schemas', 'OrganizationQueryParams', OrganizationQueryParams);
registry.registerComponent('schemas', 'OrganizationResponse', OrganizationResponse);
registry.registerComponent('schemas', 'SedeResponse', SedeResponse);
registry.registerComponent('schemas', 'OrganizationListResponse', OrganizationListResponse);
registry.registerComponent('schemas', 'SedeListResponse', SedeListResponse);

// Endpoints
registry.registerPath({
  path: '/organizaciones',
  method: 'get',
  options: {
    summary: 'Listar organizaciones',
    description: 'Obtiene una lista paginada de organizaciones con filtros opcionales',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'number', default: 1 },
        description: 'Número de página',
      },
      {
        name: 'pageSize',
        in: 'query',
        schema: { type: 'number', default: 10 },
        description: 'Tamaño de página',
      },
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Término de búsqueda',
      },
      {
        name: 'status',
        in: 'query',
        schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
        description: 'Filtrar por estado',
      },
    ],
    responses: {
      '200': {
        description: 'Lista de organizaciones obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationListResponse' },
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
  path: '/organizaciones',
  method: 'post',
  options: {
    summary: 'Crear organización',
    description: 'Crea una nueva organización (requiere rol admin)',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateOrganizationRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Organización creada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationResponse' },
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
      '409': {
        description: 'Conflicto - Nombre ya registrado',
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
  path: '/organizaciones/{organizationId}',
  method: 'get',
  options: {
    summary: 'Obtener organización por ID',
    description: 'Obtiene una organización específica por su ID',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
    ],
    responses: {
      '200': {
        description: 'Organización obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationResponse' },
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
        description: 'Organización no encontrada',
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
  path: '/organizaciones/{organizationId}',
  method: 'patch',
  options: {
    summary: 'Actualizar organización',
    description: 'Actualiza la información de una organización',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateOrganizationRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Organización actualizada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationResponse' },
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
      '404': {
        description: 'Organización no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '409': {
        description: 'Conflicto - Nombre ya registrado',
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
  path: '/organizaciones/{organizationId}',
  method: 'delete',
  options: {
    summary: 'Eliminar organización',
    description: 'Elimina una organización (requiere rol admin)',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
    ],
    responses: {
      '204': {
        description: 'Organización eliminada exitosamente',
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
        description: 'Prohibido - No tiene permisos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '404': {
        description: 'Organización no encontrada',
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
  path: '/organizaciones/{organizationId}/sedes',
  method: 'get',
  options: {
    summary: 'Listar sedes de una organización',
    description: 'Obtiene una lista paginada de sedes de una organización',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
      {
        name: 'page',
        in: 'query',
        schema: { type: 'number', default: 1 },
        description: 'Número de página',
      },
      {
        name: 'pageSize',
        in: 'query',
        schema: { type: 'number', default: 10 },
        description: 'Tamaño de página',
      },
    ],
    responses: {
      '200': {
        description: 'Lista de sedes obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SedeListResponse' },
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
        description: 'Organización no encontrada',
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
  path: '/organizaciones/{organizationId}/sedes',
  method: 'post',
  options: {
    summary: 'Crear sede',
    description: 'Crea una nueva sede para una organización',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateSedeRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Sede creada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SedeResponse' },
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
      '404': {
        description: 'Organización no encontrada',
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
  path: '/organizaciones/{organizationId}/sedes/{sedeId}',
  method: 'get',
  options: {
    summary: 'Obtener sede por ID',
    description: 'Obtiene una sede específica por su ID',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
      {
        name: 'sedeId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la sede',
      },
    ],
    responses: {
      '200': {
        description: 'Sede obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SedeResponse' },
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
        description: 'Organización o sede no encontrada',
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
  path: '/organizaciones/{organizationId}/sedes/{sedeId}',
  method: 'patch',
  options: {
    summary: 'Actualizar sede',
    description: 'Actualiza la información de una sede',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
      {
        name: 'sedeId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la sede',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateSedeRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Sede actualizada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SedeResponse' },
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
      '404': {
        description: 'Organización o sede no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '409': {
        description: 'Conflicto - Nombre ya registrado',
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
  path: '/organizaciones/{organizationId}/sedes/{sedeId}',
  method: 'delete',
  options: {
    summary: 'Eliminar sede',
    description: 'Elimina una sede (requiere rol admin)',
    tags: ['Organizaciones y Sedes'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'organizationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la organización',
      },
      {
        name: 'sedeId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID de la sede',
      },
    ],
    responses: {
      '204': {
        description: 'Sede eliminada exitosamente',
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
        description: 'Prohibido - No tiene permisos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '404': {
        description: 'Organización o sede no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});