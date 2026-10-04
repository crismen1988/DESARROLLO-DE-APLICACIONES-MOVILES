import { Request, Response } from 'express';
import { db } from '../db/store';

export class SystemController {
  public static async getHealth(req: Request, res: Response) {
    await db.checkConnection();
    res.json({
      status: 'ok',
      service: 'BañosTour API',
      framework: 'NestJS',
      database: 'PostgreSQL via Prisma',
      mobileRuntime: 'Ionic React with Capacitor',
      timestamp: new Date().toISOString(),
    });
  }

}
