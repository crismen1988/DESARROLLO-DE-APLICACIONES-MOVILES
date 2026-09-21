// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema } from '@/documentation/responses/common';

// Schemas de entrada
const LoginRequest = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const RegisterRequest = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['turista', 'operador'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
});

const RefreshTokenRequest = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido'),
});

// Schemas de salida
const LoginResponse = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['turista', 'operador', 'admin']),
    verified: z.boolean(),
  }),
  expiresIn: z.string(),
});

const SessionResponse = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['turista', 'operador', 'admin']),
  }),
});

// Registrar schemas
registry.registerComponent('schemas', 'LoginRequest', LoginRequest);
registry.registerComponent('schemas', 'RegisterRequest', RegisterRequest);
registry.registerComponent('schemas', 'RefreshTokenRequest', RefreshTokenRequest);
registry.registerComponent('schemas', 'LoginResponse', LoginResponse);
registry.registerComponent('schemas', 'SessionResponse', SessionResponse);
registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'session',
});

// Endpoints
registry.registerPath({
  path: '/auth/login',
  method: 'get',
  options: {
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve un token JWT',
    tags: ['Autenticación'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/LoginRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Inicio de sesión exitoso',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginResponse' },
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
        description: 'Credenciales inválidas',
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
  path: '/auth/session',
  method: 'get',
  options: {
    summary: 'Obtener sesión actual',
    description: 'Devuelve la información de la sesión del usuario autenticado',
    tags: ['Autenticación'],
    security: [{ cookieAuth: [] }],
    responses: {
      '200': {
        description: 'Sesión obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SessionResponse' },
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
  path: '/auth/logout',
  method: 'post',
  options: {
    summary: 'Cerrar sesión',
    description: 'Cierra la sesión del usuario y revoca el token',
    tags: ['Autenticación'],
    security: [{ cookieAuth: [] }],
    responses: {
      '204': {
        description: 'Sesión cerrada exitosamente',
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