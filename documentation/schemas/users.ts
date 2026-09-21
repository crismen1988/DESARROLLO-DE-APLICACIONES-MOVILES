// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateUserRequest = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['turista', 'operador'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
});

const UpdateUserRequest = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  phone: z.string().optional(),
  origin: z.string().optional(),
  language: z.enum(['es', 'en']).optional(),
  pushEnabled: z.boolean().optional(),
  avatarUrl: z.string().url('URL de avatar inválida').optional(),
  businessType: z.string().optional(),
  ruc: z.string().optional(),
  department: z.string().optional(),
  businessRegistration: z.string().optional(),
});

const UserQueryParams = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  pageSize: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  search: z.string().optional(),
  role: z.enum(['turista', 'operador', 'admin']).optional(),
});

// Schemas de salida
const UserResponse = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['turista', 'operador', 'admin']),
  verified: z.boolean(),
  phone: z.string().optional(),
  origin: z.string().optional(),
  language: z.enum(['es', 'en']),
  pushEnabled: z.boolean(),
  avatarUrl: z.string().url().optional(),
  businessType: z.string().optional(),
  ruc: z.string().optional(),
  department: z.string().optional(),
  businessRegistration: z.string().optional(),
  createdAt: z.string().datetime(),
});

const UserListResponse = z.object({
  data: z.array(UserResponse),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  }),
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateUserRequest', CreateUserRequest);
registry.registerComponent('schemas', 'UpdateUserRequest', UpdateUserRequest);
registry.registerComponent('schemas', 'UserQueryParams', UserQueryParams);
registry.registerComponent('schemas', 'UserResponse', UserResponse);
registry.registerComponent('schemas', 'UserListResponse', UserListResponse);

// Endpoints
registry.registerPath({
  path: '/users',
  method: 'get',
  options: {
    summary: 'Listar usuarios',
    description: 'Obtiene una lista paginada de usuarios con filtros opcionales',
    tags: ['Usuarios'],
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
        name: 'role',
        in: 'query',
        schema: { type: 'string', enum: ['turista', 'operador', 'admin'] },
        description: 'Filtrar por rol',
      },
    ],
    responses: {
      '200': {
        description: 'Lista de usuarios obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserListResponse' },
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
  path: '/users',
  method: 'post',
  options: {
    summary: 'Crear usuario',
    description: 'Crea un nuevo usuario (requiere rol admin)',
    tags: ['Usuarios'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateUserRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Usuario creado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserResponse' },
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
        description: 'Conflicto - Email ya registrado',
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
  path: '/users/{userId}',
  method: 'get',
  options: {
    summary: 'Obtener usuario por ID',
    description: 'Obtiene un usuario específico por su ID',
    tags: ['Usuarios'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID del usuario',
      },
    ],
    responses: {
      '200': {
        description: 'Usuario obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserResponse' },
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
        description: 'Usuario no encontrado',
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
  path: '/users/{userId}',
  method: 'patch',
  options: {
    summary: 'Actualizar usuario',
    description: 'Actualiza la información de un usuario',
    tags: ['Usuarios'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID del usuario',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateUserRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Usuario actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserResponse' },
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
        description: 'Usuario no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '409': {
        description: 'Conflicto - Email ya registrado',
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
  path: '/users/{userId}',
  method: 'delete',
  options: {
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario (requiere rol admin)',
    tags: ['Usuarios'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'ID del usuario',
      },
    ],
    responses: {
      '204': {
        description: 'Usuario eliminado exitosamente',
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
        description: 'Usuario no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});