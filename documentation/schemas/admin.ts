// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateAdminRequest = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'super_admin'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
});

const UpdateAdminRequest = z.object({
  email: z.string().email('Correo electrónico inválido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  role: z.enum(['admin', 'super_admin'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }).optional(),
});

// Schemas de salida
const AdminResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'super_admin']),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const AdminListResponse = z.object({
  data: z.array(AdminResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateAdminRequest', CreateAdminRequest);
registry.registerComponent('schemas', 'UpdateAdminRequest', UpdateAdminRequest);
registry.registerComponent('schemas', 'AdminResponse', AdminResponse);
registry.registerComponent('schemas', 'AdminListResponse', AdminListResponse);

// Endpoints
registry.registerPath({
  path: '/admin',
  method: 'get',
  options: {
    summary: 'Listar administradores',
    description: 'Obtiene una lista paginada de administradores',
    tags: ['Admin'],
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
    ],
    responses: {
      '200': {
        description: 'Lista de administradores obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminListResponse' },
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
  path: '/admin',
  method: 'post',
  options: {
    summary: 'Crear administrador',
    description: 'Crea un nuevo administrador',
    tags: ['Admin'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateAdminRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Administrador creado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminResponse' },
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
  path: '/admin/{adminId}',
  method: 'get',
  options: {
    summary: 'Obtener administrador por ID',
    description: 'Obtiene un administrador específico por su ID',
    tags: ['Admin'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'adminId',
        in: 'path',
        description: 'ID del administrador',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Administrador obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminResponse' },
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
        description: 'Administrador no encontrado',
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
  path: '/admin/{adminId}',
  method: 'patch',
  options: {
    summary: 'Actualizar administrador',
    description: 'Actualiza un administrador existente',
    tags: ['Admin'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'adminId',
        in: 'path',
        description: 'ID del administrador',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateAdminRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Administrador actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminResponse' },
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
        description: 'Administrador no encontrado',
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
  path: '/admin/{adminId}',
  method: 'delete',
  options: {
    summary: 'Eliminar administrador',
    description: 'Elimina un administrador',
    tags: ['Admin'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'adminId',
        in: 'path',
        description: 'ID del administrador',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Administrador eliminado exitosamente',
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
        description: 'Administrador no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});