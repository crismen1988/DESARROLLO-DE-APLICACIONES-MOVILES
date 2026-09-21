// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema } from '@/documentation/responses/common';

// Schemas de entrada
const UpdateProfileRequest = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  phone: z.string().regex(/^[+]?[0-9\s-()]+$/).optional(),
  bio: z.string().optional(),
  avatar: z.string().url('URL de avatar inválida').optional(),
  preferences: z.record(z.any()).optional(),
});

const UpdateAvatarRequest = z.object({
  avatar: z.string().url('URL de avatar inválida'),
});

// Schemas de salida
const ProfileResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  preferences: z.record(z.any()).optional(),
  role: z.enum(['turista', 'operador', 'admin']),
  verified: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

// Registrar schemas
registry.registerComponent('schemas', 'UpdateProfileRequest', UpdateProfileRequest);
registry.registerComponent('schemas', 'UpdateAvatarRequest', UpdateAvatarRequest);
registry.registerComponent('schemas', 'ProfileResponse', ProfileResponse);

// Endpoints
registry.registerPath({
  path: '/profile',
  method: 'get',
  options: {
    summary: 'Obtener perfil',
    description: 'Obtiene el perfil del usuario autenticado',
    tags: ['Perfil'],
    security: [{ cookieAuth: [] }],
    responses: {
      '200': {
        description: 'Perfil obtenido exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ProfileResponse' },
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
  path: '/profile',
  method: 'patch',
  options: {
    summary: 'Actualizar perfil',
    description: 'Actualiza el perfil del usuario autenticado',
    tags: ['Perfil'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Perfil actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ProfileResponse' },
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
  path: '/profile/avatar',
  method: 'put',
  options: {
    summary: 'Actualizar avatar',
    description: 'Actualiza el avatar del usuario',
    tags: ['Perfil'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateAvatarRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Avatar actualizado exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ProfileResponse' },
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
  path: '/profile/avatar',
  method: 'delete',
  options: {
    summary: 'Eliminar avatar',
    description: 'Elimina el avatar del usuario',
    tags: ['Perfil'],
    security: [{ cookieAuth: [] }],
    responses: {
      '204': {
        description: 'Avatar eliminado exitosamente',
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