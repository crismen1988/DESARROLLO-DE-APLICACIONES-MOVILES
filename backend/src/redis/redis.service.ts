import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    this.client = new Redis(
      process.env.REDIS_URL ??
        `redis://localhost:${process.env.REDIS_PORT ?? '6380'}`,
      { lazyConnect: true, maxRetriesPerRequest: 1 },
    );
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.client.status === 'wait') await this.client.connect();
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      if (this.client.status === 'wait') await this.client.connect();
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // La API sigue funcionando aunque Redis no esté disponible localmente.
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client.status === 'wait') await this.client.connect();
      await this.client.del(key);
    } catch {
      // La invalidación es tolerante a fallos para no bloquear el CRUD.
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      if (this.client.status === 'wait') await this.client.connect();
      let cursor = '0';
      do {
        const result = await this.client.scan(
          cursor,
          'MATCH',
          `${prefix}:*`,
          'COUNT',
          100,
        );
        cursor = result[0];
        if (result[1].length > 0) await this.client.del(...result[1]);
      } while (cursor !== '0');
    } catch {
      // Redis es opcional en el entorno local; la API continúa operativa.
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
