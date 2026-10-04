import { Request, Response } from 'express';
import { db } from '../db/store';
import { Place } from '../types';
import { AuthenticatedRequest } from '../security/jwt';
import crypto from 'crypto';

const visible = (place: Place) => place.verified && place.active !== false;

export class PlacesController {
  public static getAll(req: Request, res: Response) {
    const { category, page, limit } = req.query;
    let places = db.places.filter(visible);
    if (category && category !== 'Todos') {
      places = places.filter(p => p.category === category);
    }
    res.setHeader('X-Total-Count', String(places.length));
    if (page !== undefined || limit !== undefined) {
      const pageNumber = Number(page ?? 1);
      const pageSize = Number(limit ?? 20);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ error: 'Paginación inválida: page debe ser mayor que 0 y limit debe estar entre 1 y 100' });
      }
      res.setHeader('X-Page', String(pageNumber));
      res.setHeader('X-Page-Size', String(pageSize));
      const start = (pageNumber - 1) * pageSize;
      return res.json(places.slice(start, start + pageSize));
    }
    return res.json(places);
  }

  public static getOne(req: Request, res: Response) {
    const place = db.places.find(p => p.id === req.params.id && visible(p));
    if (!place) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    return res.json(place);
  }

  public static async create(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    const operatorId = actor.role === 'admin' ? req.body.operatorId : actor.sub;
    if (operatorId && !db.users.some(u => u.id === operatorId && u.role === 'operador')) {
      return res.status(400).json({ error: 'Operador no encontrado' });
    }
    if (operatorId && !db.users.some(u => u.id === operatorId && u.verified)) {
      return res.status(403).json({ error: 'El proveedor debe estar verificado' });
    }
    if (typeof req.body.name !== 'string' || !req.body.name.trim() || typeof req.body.description !== 'string' || !req.body.description.trim()) {
      return res.status(400).json({ error: 'Nombre y descripción son obligatorios' });
    }
    if (req.body.name.length > 120 || req.body.description.length > 2000) return res.status(400).json({ error: 'Nombre o descripción demasiado largos' });
    if (req.body.category !== undefined && !['Comida', 'Hotel', 'Hostal', 'Hostería', 'Airbnb', 'Termas', 'Mirador'].includes(req.body.category)) return res.status(400).json({ error: 'Categoría inválida' });
    if (req.body.priceRange !== undefined && !['$', '$$', '$$$'].includes(req.body.priceRange)) return res.status(400).json({ error: 'Rango de precio inválido' });
    if (req.body.tags !== undefined && (!Array.isArray(req.body.tags) || req.body.tags.length > 15 || !req.body.tags.every((tag: unknown) => typeof tag === 'string' && tag.length <= 60))) return res.status(400).json({ error: 'Etiquetas inválidas' });
    if (req.body.recommendations !== undefined && (!Array.isArray(req.body.recommendations) || req.body.recommendations.length > 10 || !req.body.recommendations.every((item: unknown) => typeof item === 'string' && item.length <= 160))) return res.status(400).json({ error: 'Recomendaciones inválidas' });
    if (req.body.openingHours !== undefined && (typeof req.body.openingHours !== 'string' || req.body.openingHours.length > 160)) return res.status(400).json({ error: 'Horario inválido' });
    if (req.body.latitude !== undefined && (!Number.isFinite(Number(req.body.latitude)) || Number(req.body.latitude) < -90 || Number(req.body.latitude) > 90)) return res.status(400).json({ error: 'Latitud inválida' });
    if (req.body.longitude !== undefined && (!Number.isFinite(Number(req.body.longitude)) || Number(req.body.longitude) < -180 || Number(req.body.longitude) > 180)) return res.status(400).json({ error: 'Longitud inválida' });
    const newPlace: Place = {
      id: `place-${crypto.randomUUID()}`,
      name: req.body.name,
      category: req.body.category || 'Hotel',
      rating: 5.0,
      priceRange: req.body.priceRange || '$$',
      address: req.body.address || 'Baños de Agua Santa',
      latitude: Number(req.body.latitude) || -1.3965,
      longitude: Number(req.body.longitude) || -78.4245,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      phone: req.body.phone || '+593 99 000 0000',
      tags: req.body.tags || ['Turismo', 'Baños'],
      openingHours: req.body.openingHours || 'Todos los días, 08:00 - 20:00',
      recommendations: req.body.recommendations || ['Confirma disponibilidad antes de visitar.'],
      operatorId,
      verified: true,
      active: true,
    };

    db.places.push(newPlace);
    await db.persist();
    res.status(201).json(newPlace);
  }

  public static async update(req: Request, res: Response) {
    const place = db.places.find(p => p.id === req.params.id);
    if (!place) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && place.operatorId !== actor.sub) return res.status(403).json({ error: 'No puedes modificar este lugar' });
    if (actor.role !== 'admin' && !db.users.some(u => u.id === actor.sub && u.verified)) return res.status(403).json({ error: 'El proveedor debe estar verificado' });
    const { name, description, address, phone, imageUrl, active, openingHours, recommendations, category } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ error: 'Nombre inválido' });
    if (description !== undefined && (typeof description !== 'string' || !description.trim())) return res.status(400).json({ error: 'Descripción inválida' });
    if (active !== undefined && typeof active !== 'boolean') return res.status(400).json({ error: 'Estado inválido' });
    if (category !== undefined && !['Comida', 'Hotel', 'Hostal', 'Hostería', 'Airbnb', 'Termas', 'Mirador'].includes(category)) return res.status(400).json({ error: 'Categoría inválida' });
    if (openingHours !== undefined && (typeof openingHours !== 'string' || openingHours.length > 160)) return res.status(400).json({ error: 'Horario inválido' });
    if (recommendations !== undefined && (!Array.isArray(recommendations) || recommendations.length > 10 || !recommendations.every((item: unknown) => typeof item === 'string' && item.length <= 160))) return res.status(400).json({ error: 'Recomendaciones inválidas' });
    if (name !== undefined) place.name = name.trim();
    if (description !== undefined) place.description = description.trim();
    if (address !== undefined) place.address = String(address);
    if (phone !== undefined) place.phone = String(phone);
    if (imageUrl !== undefined) place.imageUrl = String(imageUrl);
    if (active !== undefined) place.active = active;
    if (category !== undefined) place.category = category;
    if (openingHours !== undefined) place.openingHours = openingHours.trim();
    if (recommendations !== undefined) place.recommendations = recommendations.map((item: string) => item.trim()).filter(Boolean);
    await db.persist();
    return res.json(place);
  }

  public static async remove(req: Request, res: Response) {
    const place = db.places.find(p => p.id === req.params.id);
    if (!place) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && place.operatorId !== actor.sub) return res.status(403).json({ error: 'No puedes eliminar este lugar' });
    if (actor.role !== 'admin' && !db.users.some(u => u.id === actor.sub && u.verified)) return res.status(403).json({ error: 'El proveedor debe estar verificado' });
    place.active = false;
    await db.persist();
    return res.status(204).send();
  }
}
