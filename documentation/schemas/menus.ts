// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateMenuRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  path: z.string().min(1, 'La ruta es requerida'),
  icon: z.string().optional(),
  order: z.number().int().min(0, 'El orden debe ser un número entero positivo'),
  parentId: z.string().uuid('ID de menú padre inválido').optional(),
  roles: z.array(z.enum(['turista', 'operador', 'admin'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  })).min(1, 'Debe haber al menos un rol asignado'),
});

const UpdateMenuRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().min(1, 'La descripción es requerida').optional(),
  path: z.string().min(1, 'La ruta es requerida').optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0, 'El orden debe ser un número entero positivo').optional(),
  parentId: z.string().uuid('ID de menú padre inválido').optional(),
  roles: z.array(z.enum(['turista', 'operador', 'admin'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  })).optional(),
});

// Schemas de salida
const MenuResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  path: z.string(),
  icon: z.string().optional(),
  order: z.number().int(),
  parentId: z.string().uuid().optional(),
  roles: z.array(z.enum(['turista', 'operador', 'admin'])),
  children: z.array(z.lazy(() => MenuResponse)).optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const MenuListResponse = z.object({
  data: z.array(MenuResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateMenuRequest', CreateMenuRequest);
registry.registerComponent('schemas', 'UpdateMenuRequest', UpdateMenuRequest);
registry.registerComponent('schemas', 'MenuResponse', MenuResponse);
registry.registerComponent('schemas', 'MenuListResponse', MenuListResponse);

// Endpoints
registry.registerPath({
  path: '/menus',
  method: 'get',
  options: {
    summary: 'Listar menús',
    description: 'Obtiene una lista paginada de menús',
    tags: ['Menús'],
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
        name: 'parentId',
        in: 'query',
        description: 'Filtrar por menú padre',
        required: false,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de menús obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MenuListResponse' },
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
  path: '/menus',
  method: 'post',
  options: {
    summary: 'Crear menú',
    description: 'Crea un nuevo menú',
    tags: ['Menús'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateMenuRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Menú creado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MenuResponse' },
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
  path: '/menus/{menuId}',
  method: 'get',
  options: {
    summary: 'Obtener menú por ID',
    description: 'Obtiene un menú específico por su ID',
    tags: ['Menús'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'menuId',
        in: 'path',
        description: 'ID del menú',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Menú obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MenuResponse' },
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
        description: 'Menú no encontrado',
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
  path: '/menus/{menuId}',
  method: 'patch',
  options: {
    summary: 'Actualizar menú',
    description: 'Actualiza un menú existente',
    tags: ['Menús'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'menuId',
        in: 'path',
        description: 'ID del menú',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateMenuRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Menú actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MenuResponse' },
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
        description: 'Menú no encontrado',
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
  path: '/menus/{menuId}',
  method: 'delete',
  options: {
    summary: 'Eliminar menú',
    description: 'Elimina un menú',
    tags: ['Menús'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'menuId',
        in: 'path',
        description: 'ID del menú',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Menú eliminado exitosamente',
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
        description: 'Menú no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});