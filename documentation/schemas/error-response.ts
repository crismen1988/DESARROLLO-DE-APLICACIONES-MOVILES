// @ts-nocheck
import { z } from 'zod';

import { registry } from '@/documentation/registry';

// Schema de error de respuesta
const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

// Schema de detalle de error de validación
const ValidationErrorDetail = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

// Registrar schemas
registry.registerComponent('schemas', 'ErrorResponse', ErrorResponseSchema);
registry.registerComponent('schemas', 'ValidationErrorDetail', ValidationErrorDetail);