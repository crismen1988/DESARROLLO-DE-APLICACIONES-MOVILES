import { Request, Response } from 'express';
import { db } from '../db/store';
import type { AuthenticatedRequest } from '../security/jwt';
import type { UserRole } from '../types';

export class AdminController {
  public static getUsers(req: Request, res: Response) {
    const safeUsers = db.users.map(({ password: _, ...u }) => u);
    res.json(safeUsers);
  }

  public static async verifyUser(req: Request, res: Response) {
    const { id } = req.params;
    const { verified } = req.body;
    const user = db.users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.verified = Boolean(verified);
    await db.persist();
    const { password: _, biometricKey: __, ...safeUser } = user;
    res.json(safeUser);
  }

  public static async setRole(req: Request, res: Response) {
    const user = db.users.find(item => item.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const role = req.body.role as UserRole;
    if (!['turista', 'operador', 'admin'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    if (user.role === 'admin' && role !== 'admin' && db.users.filter(item => item.role === 'admin').length <= 1) {
      return res.status(409).json({ error: 'Debe existir al menos un administrador' });
    }
    const actor = (req as AuthenticatedRequest).user!;
    if (user.id === actor.sub && role !== 'admin') return res.status(409).json({ error: 'No puedes quitar tu propio acceso de administrador' });
    user.role = role;
    if (role === 'operador') user.verified = false;
    await db.persist();
    const { password: _, biometricKey: __, ...safeUser } = user;
    return res.json(safeUser);
  }

  public static getAnalytics(req: Request, res: Response) {
    const totalRevenue = db.bookings.reduce((sum, b) => sum + (b.status !== 'cancelada' ? b.totalPrice : 0), 0);
    const activeTourists = db.users.filter(u => u.role === 'turista').length;
    const totalTours = db.tours.length;
    const totalBookings = db.bookings.length;
    const pendingApprovals = db.users.filter(u => u.role === 'operador' && !u.verified).length;

    res.json({
      metrics: {
        totalRevenue,
        activeTourists,
        totalTours,
        totalBookings,
        pendingApprovals,
        satisfactionRate: 'Sin datos',
      },
      monthlyVisitors: [],
      popularAttractions: [],
      securityAudit: {
        jwtAlgorithm: 'HS256 (HMAC SHA-256)',
        encryptionStandard: 'Contraseñas con scrypt y tokens de sesión con SHA-256',
        biometricCompliance: 'Biometría nativa con firma criptográfica y desafío de un solo uso',
        dataPrivacyStandard: 'Controles técnicos LOPDP; revisión legal pendiente',
      },
    });
  }
}

