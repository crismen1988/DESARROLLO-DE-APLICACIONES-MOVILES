import crypto from 'crypto';

/**
 * BañosTour Backend Environment Configuration
 * Centralizes environment variables, security secrets, and runtime modes.
 */
export const ENV = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',

  // Cryptographic master secret for AES-256 and JWT HMAC
  AES_SECRET_KEY: process.env.AES_SECRET_KEY || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-change-me'),
  
  // 32-byte derived hash for AES-256-CBC cipher
  get AES_DERIVED_KEY(): Buffer {
    return crypto.createHash('sha256').update(this.AES_SECRET_KEY).digest();
  },

  // JWT Token lifespan (in seconds)
  JWT_EXPIRES_IN_SECONDS: 60 * 60,
  REFRESH_EXPIRES_IN_SECONDS: 7 * 24 * 60 * 60,
};

if (ENV.IS_PROD && ENV.AES_SECRET_KEY.length < 32) {
  throw new Error('AES_SECRET_KEY debe tener al menos 32 caracteres en producción');
}
