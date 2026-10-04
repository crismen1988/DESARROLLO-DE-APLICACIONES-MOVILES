import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const prismaCode = typeof exception === 'object' && exception !== null && 'code' in exception ? exception.code : undefined;
    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : prismaCode === 'P2002' ? HttpStatus.CONFLICT
      : prismaCode === 'P2003' ? HttpStatus.BAD_REQUEST
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException
      ? exception.message
      : prismaCode === 'P2002' ? 'El registro ya existe'
      : prismaCode === 'P2003' ? 'El registro tiene relaciones inválidas'
      : 'Error interno del servidor';
    console.error(JSON.stringify({
      level: 'error', statusCode, method: request.method, path: request.path,
      message: exception instanceof Error ? exception.message : String(exception),
      timestamp: new Date().toISOString(),
    }));
    response.status(statusCode).json({ statusCode, message, error: message, timestamp: new Date().toISOString() });
  }
}
