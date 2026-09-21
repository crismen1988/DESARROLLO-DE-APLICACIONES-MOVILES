import { Request, Response } from 'express';
import { redisCache } from '../db/redis';
import { encryptAES256, decryptAES256 } from '../security/encryption';
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

  public static getArchitecture(req: Request, res: Response) {
    redisCache.recordHit();
    res.json({
      prismaModels: [
        { name: 'AppState', fields: ['id', 'data', 'updatedAt'] },
      ],
      redisCache: redisCache.getStats(),
    });
  }

  public static encrypt(req: Request, res: Response) {
    const { plainText } = req.body;
    if (!plainText) {
      return res.status(400).json({ error: 'Texto requerido para cifrado' });
    }
    const result = encryptAES256(plainText);
    res.json(result);
  }

  public static decrypt(req: Request, res: Response) {
    const { encryptedData, iv } = req.body;
    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Datos y vector IV requeridos para descifrado' });
    }
    const decrypted = decryptAES256(encryptedData, iv);
    res.json({ decryptedText: decrypted });
  }
}
