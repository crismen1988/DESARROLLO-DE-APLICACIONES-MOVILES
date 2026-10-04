import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/environment';
import { User } from '../types';
import { db } from '../db/store';

export interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
  biometricVerified: boolean;
  iat: number;
  exp: number;
  type: 'access';
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Creates a signed JWT token using HMAC-SHA256
 */
export function generateToken(user: User, biometricVerified = false): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    biometricVerified,
    iat: now,
    exp: now + ENV.JWT_EXPIRES_IN_SECONDS,
    type: 'access',
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ENV.AES_DERIVED_KEY)
    .update(`${header}.${payloadEncoded}`)
    .digest('base64url');

  return `${header}.${payloadEncoded}.${signature}`;
}

/**
 * Validates and decodes a signed JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    if (decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') return null;
    const expectedSignature = crypto
      .createHmac('sha256', ENV.AES_DERIVED_KEY)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const decoded: JWTPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.exp || decoded.exp <= now || decoded.iat > now || typeof decoded.sub !== 'string' || decoded.type !== 'access') {
      return null; // Expired
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Express Middleware for protecting private API endpoints
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token JWT requerido' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token JWT inválido o expirado' });
  }

  const user = db.users.find(u => u.id === decoded.sub);
  if (!user) return res.status(401).json({ error: 'Sesión inválida' });
  decoded.role = user.role;

  req.user = decoded;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}
