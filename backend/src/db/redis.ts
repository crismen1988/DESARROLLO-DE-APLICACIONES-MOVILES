import { RedisCacheStats } from '../types';

/**
 * Redis Cache Simulation
 * Tracks cache performance, latencies, and hit/miss rates in real-time.
 */
class RedisCacheService {
  private stats: RedisCacheStats = {
    hits: 0,
    misses: 0,
    keysCached: 0,
    avgLatencyMs: 0,
    status: 'SIMULATED (Redis is not connected)',
  };

  public recordHit(): void {
    this.stats.hits += 1;
  }

  public recordMiss(): void {
    this.stats.misses += 1;
  }

  public getStats(): RedisCacheStats {
    return { ...this.stats };
  }

  public getHitRate(): string {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return '100%';
    return `${((this.stats.hits / total) * 100).toFixed(1)}%`;
  }
}

export const redisCache = new RedisCacheService();
