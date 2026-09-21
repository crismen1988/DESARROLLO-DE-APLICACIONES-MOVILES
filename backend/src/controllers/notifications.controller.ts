import { Request, Response } from 'express';
import { db } from '../db/store';
import { PushNotification } from '../types';
import { verifyToken } from '../security/jwt';

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
    res.status(201).json(newNotif);
  }
}
