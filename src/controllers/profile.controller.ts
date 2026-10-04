import type { Request, Response } from 'express';
import { db } from '../db/store';
import type { AuthenticatedRequest } from '../security/jwt';

export class ProfileController {
  static get(req: Request, res: Response) {
    const user = db.users.find(u => u.id === (req as AuthenticatedRequest).user?.sub);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { password: _, biometricKey: __, ...profile } = user;
    return res.json(profile);
  }

  static async update(req: Request, res: Response) {
    const user = db.users.find(u => u.id === (req as AuthenticatedRequest).user?.sub);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { name, email, phone, origin, language, pushEnabled, avatarUrl, businessType, ruc, department, businessRegistration } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ error: 'Nombre inválido' });
    if (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({ error: 'Correo inválido' });
    if (email && db.users.some(u => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Correo ya registrado' });
    if (language !== undefined && language !== 'es' && language !== 'en') return res.status(400).json({ error: 'Idioma inválido' });
    if (pushEnabled !== undefined && typeof pushEnabled !== 'boolean') return res.status(400).json({ error: 'Preferencia de notificaciones inválida' });
    if (avatarUrl !== undefined && (typeof avatarUrl !== 'string' || !avatarUrl.trim())) return res.status(400).json({ error: 'URL de avatar inválida' });
    if (businessType !== undefined && (typeof businessType !== 'string' || !businessType.trim())) return res.status(400).json({ error: 'Tipo de negocio inválido' });
    if (ruc !== undefined && (typeof ruc !== 'string' || !ruc.trim())) return res.status(400).json({ error: 'RUC inválido' });
    if (department !== undefined && (typeof department !== 'string' || !department.trim())) return res.status(400).json({ error: 'Departamento inválido' });
    if (businessRegistration !== undefined && (typeof businessRegistration !== 'string' || !businessRegistration.trim())) return res.status(400).json({ error: 'Registro comercial inválido' });
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = String(phone);
    if (origin !== undefined) user.origin = String(origin);
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();
    if (businessType !== undefined) user.businessType = businessType.trim();
    if (ruc !== undefined) user.ruc = ruc.trim();
    if (department !== undefined) user.department = department.trim();
    if (businessRegistration !== undefined) user.businessRegistration = businessRegistration.trim();
    if (language !== undefined) user.language = language;
    if (pushEnabled !== undefined) user.pushEnabled = pushEnabled;
    await db.persist();
    const { password: _, biometricKey: __, ...profile } = user;
    return res.json(profile);
  }
}
