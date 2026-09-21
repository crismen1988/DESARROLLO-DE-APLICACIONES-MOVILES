// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';
import { ErrorResponseSchema, PaginationMetaSchema } from '@/documentation/responses/common';

// Schemas de entrada
const CreateBookingRequest = z.object({
  tourId: z.string().uuid('ID de tour inválido'),
  participants: z.array(z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Correo electrónico inválido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
  })).min(1, 'Debe haber al menos un participante'),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'cash'], {
    errorMap: () => ({ message: 'Método de pago inválido' }),
  }),
});

const UpdateBookingRequest = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }).optional(),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'cash'], {
    errorMap: () => ({ message: 'Método de pago inválido' }),
  }).optional(),
});

// Schemas de salida
const BookingResponse = z.object({
  id: z.string().uuid(),
  tourId: z.string().uuid(),
  userId: z.string().uuid(),
  participants: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  })),
  specialRequests: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'cash']),
  totalAmount: z.number(),
  paidAmount: z.number(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  tour: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    location: z.string(),
  }),
});

const BookingListResponse = z.object({
  data: z.array(BookingResponse),
  meta: PaginationMetaSchema,
});

// Registrar schemas
registry.registerComponent('schemas', 'CreateBookingRequest', CreateBookingRequest);
registry.registerComponent('schemas', 'UpdateBookingRequest', UpdateBookingRequest);
registry.registerComponent('schemas', 'BookingResponse', BookingResponse);
registry.registerComponent('schemas', 'BookingListResponse', BookingListResponse);

// Endpoints
registry.registerPath({
  path: '/bookings',
  method: 'get',
  options: {
    summary: 'Listar reservas',
    description: 'Obtiene una lista paginada de reservas',
    tags: ['Reservas'],
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
        name: 'status',
        in: 'query',
        description: 'Filtrar por estado',
        required: false,
        schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
      },
    ],
    responses: {
      '200': {
        description: 'Lista de reservas obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BookingListResponse' },
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
  path: '/bookings',
  method: 'post',
  options: {
    summary: 'Crear reserva',
    description: 'Crea una nueva reserva',
    tags: ['Reservas'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateBookingRequest' },
        },
      },
    },
    responses: {
      '201': {
        description: 'Reserva creada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BookingResponse' },
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
  path: '/bookings/{bookingId}',
  method: 'get',
  options: {
    summary: 'Obtener reserva por ID',
    description: 'Obtiene una reserva específica por su ID',
    tags: ['Reservas'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'bookingId',
        in: 'path',
        description: 'ID de la reserva',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '200': {
        description: 'Reserva obtenida exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BookingResponse' },
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
        description: 'Reserva no encontrada',
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
  path: '/bookings/{bookingId}',
  method: 'patch',
  options: {
    summary: 'Actualizar reserva',
    description: 'Actualiza una reserva existente',
    tags: ['Reservas'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'bookingId',
        in: 'path',
        description: 'ID de la reserva',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateBookingRequest' },
        },
      },
    },
    responses: {
      '200': {
        description: 'Reserva actualizada exitosamente',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BookingResponse' },
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
        description: 'Reserva no encontrada',
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
  path: '/bookings/{bookingId}',
  method: 'delete',
  options: {
    summary: 'Eliminar reserva',
    description: 'Elimina una reserva',
    tags: ['Reservas'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'bookingId',
        in: 'path',
        description: 'ID de la reserva',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      '204': {
        description: 'Reserva eliminada exitosamente',
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
        description: 'Reserva no encontrada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
});