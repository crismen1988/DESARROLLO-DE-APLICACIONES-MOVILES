import { Request, Response } from 'express';
import { db } from '../db/store';
import { PushNotification } from '../types';
import { verifyToken } from '../security/jwt';
import { AuthenticatedRequest } from '../security/jwt';
import { sendPushToTokens } from '../services/fcm.service';

export class NotificationsController {
  public static getAll(req: Request, res: Response) {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const payload = token ? verifyToken(token) : null;
    const user = payload ? db.users.find(item => item.id === payload.sub) : null;
    if (user?.pushEnabled === false) return res.json([]);
    return res.json(db.notifications.filter(notification => notification.targetRole === 'todos' || notification.targetRole === user?.role));
  }

  public static async broadcast(req: Request, res: Response) {
    const { title, body, targetRole, type } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.length > 120 || typeof body !== 'string' || !body.trim() || body.length > 1000) {
      return res.status(400).json({ error: 'Título y mensaje válidos son obligatorios' });
    }
    if (targetRole !== undefined && !['todos', 'turista', 'operador'].includes(targetRole)) return res.status(400).json({ error: 'Destinatario inválido' });
    if (type !== undefined && !['alerta', 'promocion', 'reserva', 'sistema'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });

    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      targetRole: targetRole || 'todos',
      type: type || 'alerta',
      timestamp: 'Justo ahora',
      read: false,
    };

    db.notifications.unshift(newNotif);
    await db.persist();
    const recipients = db.users.filter(user =>
      user.pushEnabled !== false &&
      (newNotif.targetRole === 'todos' || user.role === newNotif.targetRole)
    );
    const tokens = recipients.flatMap(user => user.pushTokens ?? []);
    const delivery = await sendPushToTokens(tokens, newNotif).catch(() => ({ configured: true, sent: 0, failed: tokens.length }));
    res.status(201).json({ ...newNotif, delivery });
  }

  public static async registerDevice(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    if (token.length < 20 || token.length > 4096) return res.status(400).json({ error: 'Token de dispositivo inválido' });
    const user = db.users.find(candidate => candidate.id === actor.sub);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    user.pushTokens = [token, ...(user.pushTokens ?? []).filter(saved => saved !== token)].slice(0, 5);
    await db.persist();
    return res.status(204).send();
  }

  public static async unregisterDevice(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const user = db.users.find(candidate => candidate.id === actor.sub);
    if (user) {
      user.pushTokens = (user.pushTokens ?? []).filter(saved => saved !== token);
      await db.persist();
    }
    return res.status(204).send();
  }
}
