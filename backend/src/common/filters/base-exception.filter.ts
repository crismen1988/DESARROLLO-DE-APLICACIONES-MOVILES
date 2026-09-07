import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class BaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BaseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = this.getStatus(exception);

    if (status >= 500) {
      this.logger.error({
        method: request.method,
        path: request.url,
        status,
        error: exception instanceof Error ? exception.message : 'Unknown error',
      });
    }

    response.status(status).json({
      statusCode: status,
      message: this.getMessage(exception, status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (this.isPrismaError(exception, 'P2002')) return HttpStatus.CONFLICT;
    if (this.isPrismaError(exception, 'P2025')) return HttpStatus.NOT_FOUND;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown, status: number): string | string[] {
    if (!(exception instanceof HttpException)) {
      if (this.isPrismaError(exception, 'P2002')) return 'El recurso ya existe';
      if (this.isPrismaError(exception, 'P2025')) return 'El recurso no existe';
      return 'Error interno del servidor';
    }

    const message = exception.getResponse();
    if (typeof message === 'string') return message;
    if (
      typeof message === 'object' &&
      message !== null &&
      'message' in message
    ) {
      const detail = message.message;
      if (typeof detail === 'string' || Array.isArray(detail)) return detail;
    }
    return status >= 500 ? 'Error interno del servidor' : exception.message;
  }

  private isPrismaError(exception: unknown, code: string): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      exception.code === code
    );
  }
}
