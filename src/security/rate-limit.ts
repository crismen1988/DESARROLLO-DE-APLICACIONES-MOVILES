import type { NextFunction, Request, Response } from 'express';

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();
let nextCleanupAt = 0;

const positiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const GLOBAL_WINDOW_MS = positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
const GLOBAL_MAX = positiveInteger(process.env.RATE_LIMIT_MAX, 180);
const AUTH_WINDOW_MS = positiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000);
const AUTH_MAX = positiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 15);

function clientAddress(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function cleanupExpired(now: number): void {
  if (now < nextCleanupAt) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  nextCleanupAt = now + 60_000;
}

export function apiRateLimit(req: Request, res: Response, next: NextFunction): void {
  // CORS preflight requests do not authenticate a user and must never consume
  // the authentication quota. Counting them can lock out a native WebView
  // before the actual login request is sent.
  if (req.method === 'OPTIONS' || req.path === '/api/health') {
    next();
    return;
  }

  const authSensitive = /^\/api\/auth\/(login|register|forgot-password|reset-password|biometric)(\/|$)/.test(req.path);
  const windowMs = authSensitive ? AUTH_WINDOW_MS : GLOBAL_WINDOW_MS;
  const maximum = authSensitive ? AUTH_MAX : GLOBAL_MAX;
  const scope = authSensitive ? 'auth' : 'global';
  const now = Date.now();
  cleanupExpired(now);

  const key = `${scope}:${clientAddress(req)}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, maximum - bucket.count);
  res.setHeader('RateLimit-Limit', String(maximum));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > maximum) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      statusCode: 429,
      error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
      retryAfter,
    });
    return;
  }

  next();
}
