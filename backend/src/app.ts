import express, { Request, Response, NextFunction } from 'express';
import apiRouter from './routes';

/**
 * Creates and configures the Express application
 */
export function createApp(): express.Application {
  const app = express();

  // Middleware: Request Body Parsing with 10mb limit for base64 images / photos
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Middleware: CORS & Security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Routes mounted on /api
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[API Server Error]:', err);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}
