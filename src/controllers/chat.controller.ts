import { Request, Response } from 'express';
import { db } from '../db/store';
import { ChatMessage } from '../types';
import { AuthenticatedRequest } from '../security/jwt';
import crypto from 'crypto';

export class ChatController {
  public static getAll(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    res.json(db.messages.filter(m => m.senderId === actor.sub || m.recipientId === actor.sub));
  }

  public static async send(req: Request, res: Response) {
    const { recipientId, message, tourId } = req.body;
    const actor = (req as AuthenticatedRequest).user!;
    const sender = db.users.find(u => u.id === actor.sub);
    if (!sender) return res.status(401).json({ error: 'Usuario no encontrado' });

    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    const recipient = db.users.find(u => u.id === recipientId);
    if (!recipient || recipient.id === sender.id || !['turista', 'operador'].includes(recipient.role)) {
      return res.status(400).json({ error: 'Destinatario inválido' });
    }

    const newMsg: ChatMessage = {
      id: `m-${crypto.randomUUID()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      recipientId: recipient.id,
      tourId,
      message: message.trim(),
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };

    db.messages.push(newMsg);
    await db.persist();
    res.status(201).json(newMsg);
  }
}
