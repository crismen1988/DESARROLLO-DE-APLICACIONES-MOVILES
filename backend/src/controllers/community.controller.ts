import crypto from 'crypto';
import type { Request, Response } from 'express';
import { db } from '../db/store';
import type { AuthenticatedRequest } from '../security/jwt';
import type { Place, PlaceReview, TouristEvent } from '../types';

const actorId = (req: Request) => (req as AuthenticatedRequest).user!.sub;
const visiblePlace = (id: string): Place | undefined => db.places.find(place => place.id === id && place.verified && place.active !== false);

function updateRating(poiId: string): void {
  const place = db.places.find(item => item.id === poiId);
  if (!place) return;
  const reviews = db.placeReviews.filter(review => review.poiId === poiId);
  place.rating = reviews.length ? Math.round(reviews.reduce((total, review) => total + review.rating, 0) / reviews.length * 10) / 10 : 5;
}

export class CommunityController {
  static favorites(req: Request, res: Response) {
    const ids = new Set(db.favorites.filter(favorite => favorite.userId === actorId(req)).map(favorite => favorite.poiId));
    return res.json(db.places.filter(place => ids.has(place.id) && place.verified && place.active !== false));
  }

  static async addFavorite(req: Request, res: Response) {
    const { poiId } = req.body;
    if (typeof poiId !== 'string' || !visiblePlace(poiId)) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    const userId = actorId(req);
    if (db.favorites.some(favorite => favorite.userId === userId && favorite.poiId === poiId)) {
      return res.status(409).json({ error: 'El lugar ya está en favoritos' });
    }
    const favorite = { userId, poiId, addedAt: new Date().toISOString() };
    db.favorites.push(favorite);
    await db.persist();
    return res.status(201).json(favorite);
  }

  static async removeFavorite(req: Request, res: Response) {
    const index = db.favorites.findIndex(favorite => favorite.userId === actorId(req) && favorite.poiId === req.params.poiId);
    if (index < 0) return res.status(404).json({ error: 'Favorito no encontrado' });
    db.favorites.splice(index, 1);
    await db.persist();
    return res.status(204).send();
  }

  static reviews(req: Request, res: Response) {
    const poiId = req.query.poiId;
    if (typeof poiId !== 'string' || !visiblePlace(poiId)) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    return res.json(db.placeReviews.filter(review => review.poiId === poiId));
  }

  static async addReview(req: Request, res: Response) {
    const { poiId, rating, comment } = req.body;
    if (typeof poiId !== 'string' || !visiblePlace(poiId)) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== 'string' || !comment.trim() || comment.length > 500) {
      return res.status(400).json({ error: 'Calificación de 1 a 5 y comentario de 1 a 500 caracteres requeridos' });
    }
    const userId = actorId(req);
    if (db.placeReviews.some(review => review.poiId === poiId && review.userId === userId)) return res.status(409).json({ error: 'Ya calificaste este lugar' });
    const review: PlaceReview = { id: crypto.randomUUID(), userId, poiId, rating, comment: comment.trim(), createdAt: new Date().toISOString() };
    db.placeReviews.push(review);
    updateRating(poiId);
    await db.persist();
    return res.status(201).json(review);
  }

  static async updateReview(req: Request, res: Response) {
    const review = db.placeReviews.find(item => item.id === req.params.id);
    if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });
    if (review.userId !== actorId(req)) return res.status(403).json({ error: 'No puedes modificar esta reseña' });
    const { rating, comment } = req.body;
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return res.status(400).json({ error: 'Calificación inválida' });
    if (comment !== undefined && (typeof comment !== 'string' || !comment.trim() || comment.length > 500)) return res.status(400).json({ error: 'Comentario inválido' });
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment.trim();
    updateRating(review.poiId);
    await db.persist();
    return res.json(review);
  }

  static async removeReview(req: Request, res: Response) {
    const index = db.placeReviews.findIndex(item => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Reseña no encontrada' });
    const review = db.placeReviews[index];
    const actor = (req as AuthenticatedRequest).user!;
    if (review.userId !== actor.sub && actor.role !== 'admin') return res.status(403).json({ error: 'No puedes eliminar esta reseña' });
    db.placeReviews.splice(index, 1);
    updateRating(review.poiId);
    await db.persist();
    return res.status(204).send();
  }

  static events(_req: Request, res: Response) {
    return res.json(db.events.filter(event => event.active && event.startsAt >= new Date().toISOString()));
  }

  static async addEvent(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role === 'operador' && !db.users.some(user => user.id === actor.sub && user.verified)) return res.status(403).json({ error: 'El proveedor debe estar verificado' });
    const { title, description, location, startsAt } = req.body;
    if ([title, description, location, startsAt].some(value => typeof value !== 'string' || !value.trim()) || Number.isNaN(Date.parse(startsAt)) || startsAt < new Date().toISOString()) {
      return res.status(400).json({ error: 'Título, descripción, ubicación y fecha futura son obligatorios' });
    }
    const event: TouristEvent = { id: crypto.randomUUID(), operatorId: actor.sub, title: title.trim(), description: description.trim(), location: location.trim(), startsAt, active: true };
    db.events.push(event);
    await db.persist();
    return res.status(201).json(event);
  }

  static async updateEvent(req: Request, res: Response) {
    const event = db.events.find(item => item.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && event.operatorId !== actor.sub) return res.status(403).json({ error: 'No puedes modificar este evento' });
    if (actor.role !== 'admin' && !db.users.some(user => user.id === actor.sub && user.verified)) return res.status(403).json({ error: 'El proveedor debe estar verificado' });
    const { title, description, location, startsAt, active } = req.body;
    if ([title, description, location].some(value => value !== undefined && (typeof value !== 'string' || !value.trim()))) return res.status(400).json({ error: 'Datos del evento inválidos' });
    if (startsAt !== undefined && (typeof startsAt !== 'string' || Number.isNaN(Date.parse(startsAt)))) return res.status(400).json({ error: 'Fecha inválida' });
    if (active !== undefined && typeof active !== 'boolean') return res.status(400).json({ error: 'Estado inválido' });
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (location !== undefined) event.location = location.trim();
    if (startsAt !== undefined) event.startsAt = startsAt;
    if (active !== undefined) event.active = active;
    await db.persist();
    return res.json(event);
  }

  static async removeEvent(req: Request, res: Response) {
    const event = db.events.find(item => item.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && event.operatorId !== actor.sub) return res.status(403).json({ error: 'No puedes eliminar este evento' });
    event.active = false;
    await db.persist();
    return res.status(204).send();
  }

  static async report(req: Request, res: Response) {
    const { poiId, message } = req.body;
    if (typeof poiId !== 'string' || !visiblePlace(poiId)) return res.status(404).json({ error: 'Punto de interés no encontrado' });
    if (typeof message !== 'string' || !message.trim() || message.length > 1000) return res.status(400).json({ error: 'Descripción del reporte inválida' });
    const report = { id: crypto.randomUUID(), userId: actorId(req), poiId, message: message.trim(), createdAt: new Date().toISOString() };
    db.reports.push(report);
    await db.persist();
    return res.status(201).json(report);
  }

  static reports(_req: Request, res: Response) {
    return res.json(db.reports);
  }
}
