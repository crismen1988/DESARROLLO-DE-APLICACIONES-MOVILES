import { Request, Response } from 'express';
import { db } from '../db/store';
import { generateToken } from '../security/jwt';
import { User, UserRole } from '../types';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../security/password';
import { clearRefreshCookie, consumeRefreshSession, issueRefreshSession, revokeRefreshSession } from '../security/refresh';
import type { AuthenticatedRequest } from '../security/jwt';
import { isMailConfigured, sendRecoveryCode } from '../services/mail.service';

const biometricChallenges = new Map<string, { userId: string; keyId: string; value: Buffer; expiresAt: number }>();

/**
 * Controller handling user authentication, registration, recovery, and biometric auth
 */
export class AuthController {
  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !password) {
      return res.status(400).json({
        error: 'Debes proporcionar correo electrónico y contraseña.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Correo electrónico inválido' });
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      });
    }

    if (!user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({
        error: 'Credenciales incorrectas. Por favor verifica tus credenciales o recupera tu contraseña.',
      });
    }

    const token = generateToken(user, false);
    await issueRefreshSession(user, res);
    const { password: _, biometricKey: __, ...safeUser } = user;

    res.json({
      token,
      user: safeUser,
      biometricUsed: false,
      expiresIn: '1h',
    });
  }

  public static async register(req: Request, res: Response) {
    const { name, email, password, role, phone, origin, businessType, ruc } = req.body;

    if (typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string' || !email.trim() || !name.trim() || password.length < 6) {
      return res.status(400).json({ error: 'Nombre, correo electrónico y contraseña son obligatorios.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length > 120 || email.length > 254) return res.status(400).json({ error: 'Nombre o correo inválido' });
    if (role === 'operador' && (typeof ruc !== 'string' || !/^\d{13}$/.test(ruc))) return res.status(400).json({ error: 'RUC de 13 dígitos requerido' });
    if (role === 'operador' && db.users.some(user => user.ruc === ruc)) return res.status(409).json({ error: 'RUC ya registrado' });
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const userRole: UserRole = role === 'operador' ? role : 'turista';
    const newId = `user-${crypto.randomUUID()}`;

    const newUser: User = {
      id: newId,
      name,
      email,
      password: hashPassword(password),
      phone: phone || '+593 99 000 0000',
      role: userRole,
      origin: origin || 'Ecuador',
      businessType: userRole === 'operador' ? (businessType || 'Operador Turístico Baños') : undefined,
      ruc: userRole === 'operador' ? (ruc || '1800000000001') : undefined,
      businessRegistration: userRole === 'operador' ? `BT-OP-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      verified: userRole === 'turista', // Operators require administrative validation
      joinedDate: new Date().toISOString().split('T')[0],
      biometricEnabled: true,
    };

    db.users.unshift(newUser);

    if (userRole === 'operador') {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Nuevo Operador Registrado',
        body: `${name} ha registrado su emprendimiento y solicita revisión de su perfil comercial.`,
        targetRole: 'todos',
        type: 'sistema',
        timestamp: 'Justo ahora',
        read: false,
      });
    }

    await db.persist();

    const token = generateToken(newUser, false);
    await issueRefreshSession(newUser, res);
    const { password: _, biometricKey: __, ...safeUser } = newUser;

    res.status(201).json({
      token,
      user: safeUser,
      message: '¡Cuenta creada exitosamente en BañosTour!',
    });
  }

  public static async forgotPassword(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production' && !isMailConfigured()) {
      return res.status(501).json({ error: 'La recuperación de contraseña requiere un servicio de correo configurado.' });
    }
    const { email } = req.body;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Por favor ingresa tu correo electrónico.' });
    }

    const normalized = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase() === normalized);
    if (user) {
      const code = crypto.randomInt(100000, 1000000).toString();
      db.recoveryCodes[normalized] = {
        codeHash: crypto.createHash('sha256').update(code).digest('hex'),
        expiresAt: Date.now() + 15 * 60 * 1000,
        attempts: 0,
      };
      if (isMailConfigured()) {
        try {
          await sendRecoveryCode(user.email, code);
        } catch {
          delete db.recoveryCodes[normalized];
        }
      }
    }

    res.json({
      success: true,
      message: 'Si existe una cuenta asociada, recibirás un código de recuperación.',
    });
  }

  public static async resetPassword(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production' && !isMailConfigured()) {
      return res.status(501).json({ error: 'La recuperación de contraseña requiere un servicio de correo configurado.' });
    }
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Correo, código de verificación y nueva contraseña son requeridos.' });
    }

    const normalized = email.toLowerCase().trim();
    const stored = db.recoveryCodes[normalized];

    const suppliedHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    if (!stored || stored.expiresAt < Date.now() || stored.attempts >= 5) {
      delete db.recoveryCodes[normalized];
      return res.status(400).json({ error: 'El código de verificación ingresado es inválido o ha expirado.' });
    }
    stored.attempts += 1;
    const expected = Buffer.from(stored.codeHash, 'hex');
    const supplied = Buffer.from(suppliedHash, 'hex');
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      if (stored.attempts >= 5) delete db.recoveryCodes[normalized];
      return res.status(400).json({ error: 'El código de verificación ingresado es inválido o ha expirado.' });
    }

    const user = db.users.find(u => u.email.toLowerCase() === normalized);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener entre 6 y 128 caracteres.' });
    }
    user.password = hashPassword(newPassword);
    db.refreshSessions = db.refreshSessions.filter(session => session.userId !== user.id);
    delete db.recoveryCodes[normalized];
    await db.persist();

    res.json({
      success: true,
      message: 'Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión.',
    });
  }

  public static async refresh(req: Request, res: Response) {
    const user = await consumeRefreshSession(req);
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
    }
    await issueRefreshSession(user, res);
    const { password: _, biometricKey: __, ...safeUser } = user;
    return res.json({ token: generateToken(user), user: safeUser, expiresIn: '1h' });
  }

  public static async logout(req: Request, res: Response) {
    await revokeRefreshSession(req);
    clearRefreshCookie(res);
    return res.json({ success: true });
  }

  public static async enrollBiometric(req: Request, res: Response) {
    const { publicKey, keyId } = req.body;
    const user = db.users.find(item => item.id === (req as AuthenticatedRequest).user?.sub);
    if (!user || typeof publicKey !== 'string' || typeof keyId !== 'string' || publicKey.length < 40 || keyId.length > 160) return res.status(400).json({ error: 'Clave biométrica inválida.' });
    try { crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64url'), format: 'der', type: 'spki' }); } catch { return res.status(400).json({ error: 'Clave pública inválida.' }); }
    user.biometricKey = JSON.stringify({ publicKey, keyId });
    user.biometricEnabled = true;
    await db.persist();
    return res.status(204).send();
  }

  public static async revokeBiometric(req: Request, res: Response) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    const user = db.users.find(item => item.id === userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    user.biometricKey = undefined;
    user.biometricEnabled = false;
    for (const [id, pending] of biometricChallenges) {
      if (pending.userId === user.id) biometricChallenges.delete(id);
    }
    await db.persist();
    return res.status(204).send();
  }

  public static async biometricAuth(req: Request, res: Response) {
    const { userId, keyId, action, signature, challengeId } = req.body;
    const user = db.users.find(item => item.id === userId);
    if (!user || !user.biometricEnabled || !user.biometricKey || typeof keyId !== 'string') return res.status(401).json({ error: 'Dispositivo biométrico no autorizado.' });
    let saved: { publicKey: string; keyId: string };
    try { saved = JSON.parse(user.biometricKey); } catch { return res.status(401).json({ error: 'Vuelve a vincular este dispositivo.' }); }
    if (saved.keyId !== keyId) return res.status(401).json({ error: 'Dispositivo biométrico no autorizado.' });
    if (action === 'challenge') {
      for (const [id, pending] of biometricChallenges) {
        if (pending.expiresAt < Date.now() || (pending.userId === userId && pending.keyId === keyId)) biometricChallenges.delete(id);
      }
      const id = crypto.randomUUID();
      const value = crypto.randomBytes(32);
      biometricChallenges.set(id, { userId, keyId, value, expiresAt: Date.now() + 60_000 });
      return res.json({ challengeId: id, challenge: value.toString('base64url') });
    }
    const pending = biometricChallenges.get(challengeId);
    biometricChallenges.delete(challengeId);
    if (!pending || pending.userId !== userId || pending.keyId !== keyId || pending.expiresAt < Date.now() || typeof signature !== 'string') return res.status(401).json({ error: 'Desafío biométrico vencido o inválido.' });
    const valid = crypto.verify('sha256', pending.value, { key: Buffer.from(saved.publicKey, 'base64url'), format: 'der', type: 'spki' }, Buffer.from(signature, 'base64url'));
    if (!valid) return res.status(401).json({ error: 'Firma biométrica inválida.' });
    const token = generateToken(user, true);
    await issueRefreshSession(user, res);
    const { password: _, biometricKey: __, ...safeUser } = user;
    return res.json({ token, user: safeUser, biometricUsed: true, expiresIn: '1h' });
  }
}
