import crypto from 'crypto';
import type { Response, Request } from 'express';
import { ENV } from '../config/environment';
import { db } from '../db/store';
import type { User } from '../types';

const COOKIE_NAME = 'banostour_refresh';

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenFromRequest(req: Request): string | null {
  const value = req.headers.cookie?.split(';').map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  return value || null;
}

export function setRefreshCookie(res: Response, token: string): void {
  const secure = ENV.IS_PROD ? '; Secure' : '';
  const sameSite = ENV.IS_PROD ? 'None' : 'Lax';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; SameSite=${sameSite}; Path=/api/auth; Max-Age=${ENV.REFRESH_EXPIRES_IN_SECONDS}${secure}`);
}

export function clearRefreshCookie(res: Response): void {
  const secure = ENV.IS_PROD ? '; Secure' : '';
  const sameSite = ENV.IS_PROD ? 'None' : 'Lax';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=${sameSite}; Path=/api/auth; Max-Age=0${secure}`);
}

export async function issueRefreshSession(user: User, res: Response): Promise<void> {
  const token = crypto.randomBytes(48).toString('base64url');
  db.refreshSessions = db.refreshSessions.filter(session => session.expiresAt > Date.now());
  db.refreshSessions.push({
    tokenHash: tokenHash(token),
    userId: user.id,
    expiresAt: Date.now() + ENV.REFRESH_EXPIRES_IN_SECONDS * 1000,
  });
  await db.persist();
  setRefreshCookie(res, token);
}

export async function consumeRefreshSession(req: Request): Promise<User | null> {
  const token = refreshTokenFromRequest(req);
  if (!token) return null;
  const hash = tokenHash(token);
  const index = db.refreshSessions.findIndex(session => session.tokenHash === hash);
  if (index < 0) return null;
  const [session] = db.refreshSessions.splice(index, 1);
  await db.persist();
  if (session.expiresAt <= Date.now()) return null;
  return db.users.find(user => user.id === session.userId) ?? null;
}

export async function revokeRefreshSession(req: Request): Promise<void> {
  const token = refreshTokenFromRequest(req);
  if (!token) return;
  const hash = tokenHash(token);
  db.refreshSessions = db.refreshSessions.filter(session => session.tokenHash !== hash);
  await db.persist();
}
