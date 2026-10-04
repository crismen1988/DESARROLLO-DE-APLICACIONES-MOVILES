import { Request, Response } from 'express';
import { db } from '../db/store';
import { Tour } from '../types';
import { AuthenticatedRequest } from '../security/jwt';
import crypto from 'crypto';

const isValidImageReference = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim() || value.length > 2_500_000) return false;
  const image = value.trim();
  return image.startsWith('data:image/jpeg;base64,') ||
    image.startsWith('data:image/png;base64,') ||
    image.startsWith('data:image/webp;base64,') ||
    image.startsWith('https://') ||
    image.startsWith('http://');
};

export class ToursController {
  public static getAll(req: Request, res: Response) {
    const { category, search, operatorId, page, limit } = req.query;
    let filtered = [...db.tours];

    if (category && category !== 'Todos') {
      filtered = filtered.filter(t => t.category === category);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    if (operatorId) {
      filtered = filtered.filter(t => t.operatorId === operatorId);
    }

    res.setHeader('X-Total-Count', String(filtered.length));
    if (page !== undefined || limit !== undefined) {
      const pageNumber = Number(page ?? 1);
      const pageSize = Number(limit ?? 20);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ error: 'Paginación inválida: page debe ser mayor que 0 y limit debe estar entre 1 y 100' });
      }
      res.setHeader('X-Page', String(pageNumber));
      res.setHeader('X-Page-Size', String(pageSize));
      const start = (pageNumber - 1) * pageSize;
      return res.json(filtered.slice(start, start + pageSize));
    }
    return res.json(filtered);
  }

  public static async create(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    const operatorId = actor.role === 'admin' ? (req.body.operatorId || 'op-1') : actor.sub;
    const operator = db.users.find(u => u.id === operatorId && u.role === 'operador');
    if (!operator) return res.status(400).json({ error: 'Operador no encontrado' });
    if (!operator.verified) return res.status(403).json({ error: 'El operador requiere aprobación' });
    if (typeof req.body.title !== 'string' || !req.body.title.trim() || !Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0 || !Number.isInteger(Number(req.body.maxCapacity)) || Number(req.body.maxCapacity) < 1) {
      return res.status(400).json({ error: 'Título, precio y cupos válidos son obligatorios' });
    }
    if (req.body.title.length > 120 || (req.body.description !== undefined && (typeof req.body.description !== 'string' || req.body.description.length > 2000))) return res.status(400).json({ error: 'Texto del tour inválido' });
    if (req.body.category !== undefined && !['Aventura', 'Cascadas', 'Relax', 'Naturaleza', 'Cultura'].includes(req.body.category)) return res.status(400).json({ error: 'Categoría inválida' });
    if (req.body.difficulty !== undefined && !['Fácil', 'Moderado', 'Exigente'].includes(req.body.difficulty)) return res.status(400).json({ error: 'Dificultad inválida' });
    if (req.body.imageUrl !== undefined && !isValidImageReference(req.body.imageUrl)) return res.status(400).json({ error: 'Selecciona una imagen válida de hasta 2.5 MB' });
    if (req.body.included !== undefined && (!Array.isArray(req.body.included) || !req.body.included.every((item: unknown) => typeof item === 'string' && item.length <= 120))) return res.status(400).json({ error: 'Servicios incluidos inválidos' });
    if (req.body.availableDays !== undefined && (!Array.isArray(req.body.availableDays) || !req.body.availableDays.every((day: unknown) => typeof day === 'string'))) return res.status(400).json({ error: 'Días disponibles inválidos' });
    const newTour: Tour = {
      id: `tour-${crypto.randomUUID()}`,
      title: req.body.title || 'Nuevo Tour Baños',
      operatorId,
      operatorName: operator.name,
      category: req.body.category || 'Aventura',
      price: Number(req.body.price) || 25,
      duration: req.body.duration || '3 horas',
      difficulty: req.body.difficulty || 'Moderado',
      rating: 5.0,
      reviewsCount: 1,
      description: req.body.description || 'Experiencia inolvidable en Baños de Agua Santa.',
      included: req.body.included || ['Guía profesional', 'Equipo de seguridad homologado'],
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      latitude: Number(req.body.latitude) || -1.4000,
      longitude: Number(req.body.longitude) || -78.4200,
      availableDays: req.body.availableDays || ['Lunes', 'Miércoles', 'Viernes', 'Sábado', 'Domingo'],
      maxCapacity: Number(req.body.maxCapacity) || 20,
      currentBooked: 0,
      isOpen: true,
    };

    db.tours.unshift(newTour);
    await db.persist();
    res.status(201).json(newTour);
  }

  public static async updateAvailability(req: Request, res: Response) {
    const { id } = req.params;
    const { isOpen, maxCapacity } = req.body;
    const tour = db.tours.find(t => t.id === id);

    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && tour.operatorId !== actor.sub) {
      return res.status(403).json({ error: 'No puedes modificar este tour' });
    }

    if (typeof isOpen !== 'undefined' && typeof isOpen !== 'boolean') return res.status(400).json({ error: 'Disponibilidad inválida' });
    if (typeof maxCapacity !== 'undefined' && (!Number.isInteger(Number(maxCapacity)) || Number(maxCapacity) < tour.currentBooked)) return res.status(400).json({ error: 'Capacidad inválida' });
    if (isOpen !== undefined) tour.isOpen = isOpen;
    if (maxCapacity !== undefined) tour.maxCapacity = Number(maxCapacity);

    await db.persist();

    res.json(tour);
  }

  public static async update(req: Request, res: Response) {
    const tour = db.tours.find(candidate => candidate.id === req.params.id);
    if (!tour) return res.status(404).json({ error: 'Tour no encontrado' });

    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && tour.operatorId !== actor.sub) {
      return res.status(403).json({ error: 'No puedes editar este tour' });
    }

    const { title, price, duration, difficulty, category, maxCapacity, description, imageUrl } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({ error: 'Ingresa un título válido de hasta 120 caracteres' });
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: 'Ingresa un precio válido' });
    }
    if (typeof duration !== 'string' || !duration.trim() || duration.length > 80) {
      return res.status(400).json({ error: 'Ingresa una duración válida' });
    }
    if (!['Fácil', 'Moderado', 'Exigente'].includes(difficulty)) {
      return res.status(400).json({ error: 'Dificultad inválida' });
    }
    if (!['Aventura', 'Cascadas', 'Relax', 'Naturaleza', 'Cultura'].includes(category)) {
      return res.status(400).json({ error: 'Categoría inválida' });
    }
    if (!Number.isInteger(Number(maxCapacity)) || Number(maxCapacity) < Math.max(1, tour.currentBooked)) {
      return res.status(400).json({ error: `La capacidad no puede ser menor que ${Math.max(1, tour.currentBooked)}` });
    }
    if (typeof description !== 'string' || !description.trim() || description.length > 2000) {
      return res.status(400).json({ error: 'Ingresa una descripción válida de hasta 2000 caracteres' });
    }
    if (!isValidImageReference(imageUrl)) {
      return res.status(400).json({ error: 'Selecciona una imagen válida de hasta 2.5 MB' });
    }

    Object.assign(tour, {
      title: title.trim(),
      price: Number(price),
      duration: duration.trim(),
      difficulty,
      category,
      maxCapacity: Number(maxCapacity),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
    });
    await db.persist();
    return res.json(tour);
  }

  public static async remove(req: Request, res: Response) {
    const index = db.tours.findIndex(candidate => candidate.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Tour no encontrado' });

    const tour = db.tours[index];
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && tour.operatorId !== actor.sub) {
      return res.status(403).json({ error: 'No puedes eliminar este tour' });
    }
    const hasActiveBookings = db.bookings.some(booking =>
      booking.tourId === tour.id && ['confirmada', 'pendiente'].includes(booking.status)
    );
    if (hasActiveBookings) {
      return res.status(409).json({ error: 'No puedes eliminar un tour con reservas activas. Cancela o completa esas reservas primero.' });
    }

    db.tours.splice(index, 1);
    await db.persist();
    return res.status(204).send();
  }
}
