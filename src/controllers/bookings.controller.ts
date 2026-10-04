import { Request, Response } from 'express';
import { db } from '../db/store';
import { encryptAES256 } from '../security/encryption';
import { Booking } from '../types';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../security/jwt';

export class BookingsController {
  public static getAll(req: Request, res: Response) {
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role === 'admin') {
      return res.json(db.bookings);
    }
    if (actor.role === 'operador') {
      return res.json(db.bookings.filter(b => b.operatorId === actor.sub));
    }
    res.json(db.bookings.filter(b => b.userId === actor.sub));
  }

  public static async create(req: Request, res: Response) {
    const { tourId, date, participants, passportNumber } = req.body;
    const actor = (req as AuthenticatedRequest).user!;
    const user = db.users.find(u => u.id === actor.sub);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    const tour = db.tours.find(t => t.id === tourId);

    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }

    const numPeople = Number(participants);
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || date < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: 'Selecciona una fecha válida que no haya pasado' });
    }
    if (typeof passportNumber !== 'undefined' && (typeof passportNumber !== 'string' || passportNumber.length > 80)) {
      return res.status(400).json({ error: 'Documento inválido' });
    }
    if (!Number.isInteger(numPeople) || numPeople < 1 || numPeople > tour.maxCapacity - tour.currentBooked || !tour.isOpen) {
      return res.status(400).json({ error: 'Número de participantes inválido o sin cupos disponibles' });
    }
    const totalPrice = tour.price * numPeople;
    const bookingId = `BK-${crypto.randomUUID()}`;

    const newBooking: Booking = {
      id: bookingId,
      tourId: tour.id,
      tourTitle: tour.title,
      tourImage: tour.imageUrl,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      operatorId: tour.operatorId,
      operatorName: tour.operatorName,
      date,
      participants: numPeople,
      totalPrice,
      status: 'confirmada',
      qrCode: `BANOS-QR-${crypto.randomUUID().toUpperCase()}`,
      encryptedPassport: passportNumber ? encryptAES256(passportNumber) : undefined,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    tour.currentBooked += numPeople;
    db.bookings.unshift(newBooking);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: '¡Nueva Reserva Recibida!',
      body: `${newBooking.userName} reservó ${numPeople} cupo(s) para "${tour.title}".`,
      targetRole: 'operador',
      type: 'reserva',
      timestamp: 'Justo ahora',
      read: false,
    });

    await db.persist();

    res.status(201).json(newBooking);
  }

  public static async update(req: Request, res: Response) {
    const booking = db.bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && booking.userId !== actor.sub) {
      return res.status(403).json({ error: 'No puedes modificar esta reserva' });
    }
    if (booking.status === 'completada' || booking.status === 'cancelada') {
      return res.status(409).json({ error: 'Esta reserva ya no puede modificarse' });
    }

    const tour = db.tours.find(t => t.id === booking.tourId);
    if (!tour) return res.status(404).json({ error: 'Tour no encontrado' });
    const date = req.body.date ?? booking.date;
    const participants = Number(req.body.participants ?? booking.participants);
    const today = new Date().toISOString().slice(0, 10);
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || date < today) {
      return res.status(400).json({ error: 'Selecciona una fecha válida que no haya pasado' });
    }
    const availableCapacity = tour.maxCapacity - tour.currentBooked + booking.participants;
    if (!Number.isInteger(participants) || participants < 1 || participants > availableCapacity || !tour.isOpen) {
      return res.status(400).json({ error: 'Número de participantes inválido o sin cupos disponibles' });
    }

    tour.currentBooked += participants - booking.participants;
    booking.date = date;
    booking.participants = participants;
    booking.totalPrice = tour.price * participants;
    await db.persist();
    return res.json(booking);
  }

  public static async remove(req: Request, res: Response) {
    const index = db.bookings.findIndex(b => b.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    const booking = db.bookings[index];
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && booking.userId !== actor.sub) {
      return res.status(403).json({ error: 'No puedes eliminar esta reserva' });
    }
    if (booking.status === 'completada') {
      return res.status(409).json({ error: 'Una reserva completada no puede eliminarse' });
    }
    if (booking.status !== 'cancelada') {
      const tour = db.tours.find(t => t.id === booking.tourId);
      if (tour) tour.currentBooked = Math.max(0, tour.currentBooked - booking.participants);
    }
    db.bookings.splice(index, 1);
    await db.persist();
    return res.status(204).send();
  }

  public static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const booking = db.bookings.find(b => b.id === id);

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const actor = (req as AuthenticatedRequest).user!;
    if (actor.role !== 'admin' && booking.operatorId !== actor.sub) {
      return res.status(403).json({ error: 'No puedes modificar esta reserva' });
    }

    if (!['confirmada', 'pendiente', 'completada', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Estado de reserva inválido' });
    }
    const terminalStatuses: Booking['status'][] = ['completada', 'cancelada'];
    if (terminalStatuses.includes(booking.status)) {
      if (booking.status === status) return res.json(booking);
      return res.status(409).json({ error: 'Una reserva completada o cancelada no puede reactivarse ni cambiar de estado' });
    }
    if (status === 'completada' && booking.date > new Date().toISOString().slice(0, 10)) {
      return res.status(409).json({ error: 'No puedes completar una reserva antes de la fecha del servicio' });
    }
    if (terminalStatuses.includes(status)) {
      const tour = db.tours.find(t => t.id === booking.tourId);
      if (tour) tour.currentBooked = Math.max(0, tour.currentBooked - booking.participants);
    }
    booking.status = status;
    await db.persist();
    res.json(booking);
  }
}
