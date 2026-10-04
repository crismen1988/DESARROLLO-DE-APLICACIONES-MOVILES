import { Tour, Place, Booking, ChatMessage, PushNotification, User, RefreshSession } from '../types';
import { encryptAES256 } from '../security/encryption';
import { Prisma, PrismaClient } from '@prisma/client';
import { hashPassword } from '../security/password';
import crypto from 'crypto';

/**
 * BañosTour state store backed by PostgreSQL 16 through Prisma ORM.
 * Data is loaded into memory for fast access and persisted after every write.
 */

// Initial Seed: Exactly 1 Operator and 1 Administrator. ZERO tourist accounts pre-existing.
const initialUsers: User[] = [
  {
    id: 'op-1',
    name: 'Pastaza Adventure Tours',
    email: 'operador@banostour.ec',
    password: 'operador123',
    role: 'operador',
    phone: '+593 99 876 5432',
    origin: 'Baños de Agua Santa, Ecuador',
    businessType: 'Deportes Extremos, Rafting & Hospedaje',
    ruc: '1804918239001',
    businessRegistration: 'BT-OP-2026-089',
    verified: true,
    biometricEnabled: true,
    joinedDate: '2024-03-15',
    rating: 4.9,
  },
  {
    id: 'admin-1',
    name: 'Ing. Patricia Viteri',
    email: 'admin@banostour.ec',
    password: 'admin123',
    role: 'admin',
    phone: '+593 3 274 0422',
    origin: 'Baños de Agua Santa, Ecuador',
    department: 'Administración de BañosTour',
    verified: true,
    biometricEnabled: true,
    joinedDate: '2023-01-01',
  },
];

// Initial Seed: Tours offered exclusively by the Operator (op-1)
const initialTours: Tour[] = [
  {
    id: 'tour-1',
    title: 'Ruta de las Cascadas & Pailón del Diablo en Chiva',
    operatorId: 'op-1',
    operatorName: 'Pastaza Adventure Tours',
    category: 'Cascadas',
    price: 15,
    duration: '4 horas',
    difficulty: 'Fácil',
    rating: 4.9,
    reviewsCount: 342,
    description: 'Recorrido legendario cruzando Agoyán, Manto de la Novia, cruce en tarabita sobre el cañón y caminata al impresionante Pailón del Diablo.',
    included: ['Transporte en chiva típica', 'Guía especializado', 'Paseo en Tarabita', 'Entrada al Pailón'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    latitude: -1.4022,
    longitude: -78.2983,
    availableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    maxCapacity: 30,
    currentBooked: 0,
    isOpen: true,
  },
  {
    id: 'tour-2',
    title: 'Rafting Extremo en Río Pastaza (Nivel III-IV)',
    operatorId: 'op-1',
    operatorName: 'Pastaza Adventure Tours',
    category: 'Aventura',
    price: 35,
    duration: '5 horas',
    difficulty: 'Exigente',
    rating: 5.0,
    reviewsCount: 218,
    description: 'Adrenalina pura en los rápidos de la cuenca amazónica del río Pastaza. Incluye equipo homologado internacional IRF y kayak de seguridad.',
    included: ['Equipo completo de neopreno y casco', 'Guía internacional IRF', 'Fotos y video HD GoPro', 'Almuerzo completo'],
    imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    latitude: -1.3980,
    longitude: -78.3320,
    availableDays: ['Viernes', 'Sábado', 'Domingo'],
    maxCapacity: 16,
    currentBooked: 0,
    isOpen: true,
  },
  {
    id: 'tour-3',
    title: 'Canyoning Cascada Chamana & Rappel en Agua',
    operatorId: 'op-1',
    operatorName: 'Pastaza Adventure Tours',
    category: 'Aventura',
    price: 30,
    duration: '3.5 horas',
    difficulty: 'Moderado',
    rating: 4.9,
    reviewsCount: 164,
    description: 'Desciende cascadas cristalinas usando arneses de alta montaña, toboganes naturales de roca y saltos a pozas.',
    included: ['Traje de neopreno 5mm', 'Arnés y casco homologado', 'Instructores de rescate vertical', 'Snack energético'],
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    latitude: -1.4011,
    longitude: -78.3762,
    availableDays: ['Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    maxCapacity: 12,
    currentBooked: 0,
    isOpen: true,
  },
];

// Initial Seed: Places (Lodging & Local Gastronomy of Baños)
const initialPlaces: Place[] = [
  {
    id: 'place-1',
    name: 'Hostal & Spa Sangay Ecolodge (Servicio Operador)',
    category: 'Hostal',
    rating: 4.9,
    priceRange: '$$',
    address: 'Plaza Cascada Cabellera de la Virgen, Baños',
    latitude: -1.3962,
    longitude: -78.4218,
    description: 'Alojamiento exclusivo y ecológico operado por Pastaza Adventure Tours frente a la cascada termal. Habitaciones con balcón y spa.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    phone: '+593 99 876 5432',
    tags: ['Servicio Operador', 'Spa & Termas', 'Desayuno incluido'],
    openingHours: 'Recepción 24 horas; spa de 09:00 a 20:00',
    recommendations: ['Reserva el spa con anticipación.', 'Lleva traje de baño y calzado antideslizante.'],
    operatorId: 'op-1',
    verified: true,
  },
  {
    id: 'place-2',
    name: 'Restaurante & Truchas El Chozo del Río Pastaza',
    category: 'Comida',
    rating: 4.9,
    priceRange: '$$',
    address: 'Vía a Baños - Puyo Km 14, Sector Río Verde',
    latitude: -1.4035,
    longitude: -78.2970,
    description: 'Gastronomía típica ofrecida en conjunto con las expediciones de rafting. Famoso por sus truchas frescas a la plancha y patacones.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    phone: '+593 99 876 5432',
    tags: ['Servicio Operador', 'Trucha fresca', 'Cocina tradicional'],
    openingHours: 'Todos los días, 11:00 - 21:00',
    recommendations: ['Prueba la trucha a la plancha.', 'Visita antes de las 13:00 los fines de semana.'],
    operatorId: 'op-1',
    verified: true,
  },
  {
    id: 'place-3',
    name: 'Dulces y Melcochas Tradicionales Don Juan',
    category: 'Comida',
    rating: 4.8,
    priceRange: '$',
    address: 'Calle Ambato y Thomas Halflants, Centro de Baños',
    latitude: -1.3968,
    longitude: -78.4239,
    description: 'Demostración en vivo del estirado artesanal de melcocha en madera de guayacán. Dulces de guayaba y alfeñiques.',
    imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=800&q=80',
    phone: '+593 98 765 4321',
    tags: ['Artesanal', 'Tradición banense', 'Degustación'],
    openingHours: 'Lunes a domingo, 09:00 - 20:00',
    recommendations: ['Solicita una demostración de elaboración.', 'Conserva las melcochas en un lugar fresco.'],
    verified: true,
  },
  {
    id: 'place-4',
    name: 'Airbnb Mirador del Tungurahua',
    category: 'Airbnb',
    rating: 4.8,
    priceRange: '$$',
    address: 'Sector Bellavista, Baños de Agua Santa',
    latitude: -1.4112,
    longitude: -78.4306,
    description: 'Alojamiento independiente con vista panorámica a Baños, cocina equipada, internet y estacionamiento privado.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
    phone: '+593 98 555 0198',
    tags: ['Vista panorámica', 'Cocina equipada', 'Estacionamiento'],
    openingHours: 'Check-in 15:00; check-out 11:00',
    recommendations: ['Coordina la llegada con el anfitrión.', 'Se recomienda vehículo para acceder al mirador.'],
    verified: true,
  },
  {
    id: 'place-5',
    name: 'Mirador Bellavista',
    category: 'Mirador',
    rating: 4.7,
    priceRange: '$',
    address: 'Vía a Bellavista, Baños de Agua Santa',
    latitude: -1.4055,
    longitude: -78.4225,
    description: 'Mirador panorámico sobre la ciudad de Baños y el corredor del volcán Tungurahua, ideal para fotografía al amanecer.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    phone: '+593 98 000 0000',
    tags: ['Panorámica', 'Fotografía', 'Naturaleza'],
    openingHours: 'Todos los días, 06:00 - 19:00',
    recommendations: ['Visita al amanecer para mejor visibilidad.', 'Lleva abrigo y calzado con buen agarre.'],
    verified: true,
  },
];

// Initial Seed: Bookings (Starts empty until registered tourists book)
const initialBookings: Booking[] = [];

// Initial Seed: Chat Messages (Starts empty)
const initialMessages: ChatMessage[] = [];

// Initial Seed: Notifications
const initialNotifications: PushNotification[] = [
  {
    id: 'notif-1',
    title: 'Clima en Baños: Soleado 21°C',
    body: 'Excelente visibilidad hacia el volcán Tungurahua. Condiciones ideales para deportes extremos.',
    targetRole: 'todos',
    type: 'sistema',
    timestamp: 'Hace 15 min',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Pailón del Diablo: Senderos 100% Habilitados',
    body: 'El caudal del río Pastaza se encuentra en niveles normales de seguridad turística.',
    targetRole: 'turista',
    type: 'alerta',
    timestamp: 'Hace 45 min',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Descuento 15% en Rafting Pastaza',
    body: 'Aprovecha tarifa especial para grupos mayores a 3 personas reservando hoy.',
    targetRole: 'turista',
    type: 'promocion',
    timestamp: 'Hace 2 horas',
    read: false,
  },
];

/**
 * In-memory Store Singleton Instance
 */
type StoredState = Pick<DatabaseStore, 'users' | 'tours' | 'places' | 'bookings' | 'messages' | 'notifications' | 'refreshSessions'>;

const RELATIONAL_MIGRATION_ID = 'app-state-to-relational-v1';

const roleToDb = (role: User['role']) => role.toUpperCase() as 'TURISTA' | 'OPERADOR' | 'ADMIN';
const roleFromDb = (role: string) => role.toLowerCase() as User['role'];
const tourCategoryToDb = (category: Tour['category']) => category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() as 'AVENTURA' | 'CASCADAS' | 'RELAX' | 'NATURALEZA' | 'CULTURA';
const tourCategoryFromDb = (category: string) => `${category.charAt(0)}${category.slice(1).toLowerCase()}` as Tour['category'];
const placeCategoryToDb = (category: Place['category']) => category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() as 'COMIDA' | 'HOTEL' | 'HOSTAL' | 'HOSTERIA' | 'AIRBNB' | 'TERMAS' | 'MIRADOR';
const placeCategoryFromDb = (category: string) => {
  const labels: Record<string, Place['category']> = {
    COMIDA: 'Comida', HOTEL: 'Hotel', HOSTAL: 'Hostal', HOSTERIA: 'Hostería',
    AIRBNB: 'Airbnb', TERMAS: 'Termas', MIRADOR: 'Mirador',
  };
  return labels[category] ?? 'Hotel';
};
const bookingStatusToDb = (status: Booking['status']) => status.toUpperCase() as 'CONFIRMADA' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
const bookingStatusFromDb = (status: string) => status.toLowerCase() as Booking['status'];
const validDate = (value: string | undefined, fallback = new Date()) => {
  const parsed = value ? new Date(value) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};
const displayBookingDate = (value: Date) => value.toISOString().slice(0, 10);
const displayCreatedAt = (value: Date) => value.toISOString().replace('T', ' ').slice(0, 16);

class DatabaseStore {
  private readonly prisma = new PrismaClient();
  private writeQueue: Promise<void> = Promise.resolve();
  public users: User[] = process.env.NODE_ENV === 'production' ? [] : [...initialUsers];
  public tours: Tour[] = process.env.NODE_ENV === 'production' ? [] : [...initialTours];
  public places: Place[] = process.env.NODE_ENV === 'production' ? [] : [...initialPlaces];
  public bookings: Booking[] = [...initialBookings];
  public messages: ChatMessage[] = [...initialMessages];
  public notifications: PushNotification[] = process.env.NODE_ENV === 'production' ? [] : [...initialNotifications];
  public refreshSessions: RefreshSession[] = [];
  public recoveryCodes: Record<string, { codeHash: string; expiresAt: number; attempts: number }> = {};

  public async initialize(): Promise<void> {
    if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)) {
      throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) antes de iniciar producción');
    }
    const migration = await this.prisma.dataMigration.findUnique({ where: { id: RELATIONAL_MIGRATION_ID } });
    let importedLegacyState = false;
    if (!migration) {
      const state = await this.prisma.appState.findUnique({ where: { id: 'main' } });
      if (state) {
        const saved = state.data as unknown as StoredState;
        this.users = saved.users ?? [];
        this.tours = saved.tours ?? [];
        this.places = saved.places ?? [];
        this.bookings = saved.bookings ?? [];
        this.messages = saved.messages ?? [];
        this.notifications = saved.notifications ?? [];
        this.refreshSessions = saved.refreshSessions ?? [];
        importedLegacyState = true;
      } else if (await this.prisma.user.count()) {
        await this.loadRelationalState();
      }
    } else {
      await this.loadRelationalState();
    }
    let upgraded = !migration;
    for (const place of this.places) {
      if (!place.openingHours) {
        place.openingHours = 'Consulta el horario antes de visitar.';
        upgraded = true;
      }
      if (!Array.isArray(place.recommendations) || place.recommendations.length === 0) {
        place.recommendations = ['Confirma disponibilidad antes de visitar.'];
        upgraded = true;
      }
    }
    if (!this.places.some(place => place.category === 'Airbnb')) {
      const airbnb = initialPlaces.find(place => place.category === 'Airbnb');
      if (airbnb) this.places.push({ ...airbnb, tags: [...airbnb.tags], recommendations: [...airbnb.recommendations] });
      upgraded = true;
    }
    if (!this.places.some(place => place.category === 'Mirador')) {
      const viewpoint = initialPlaces.find(place => place.category === 'Mirador');
      if (viewpoint) this.places.push({ ...viewpoint, tags: [...viewpoint.tags], recommendations: [...viewpoint.recommendations] });
      upgraded = true;
    }
    if (process.env.NODE_ENV === 'production') {
      const legacyAdmin = this.users.find(u => u.id === 'admin-1');
      if (legacyAdmin && (legacyAdmin.password === 'admin123' || !legacyAdmin.password?.startsWith('scrypt:'))) {
        legacyAdmin.email = process.env.ADMIN_EMAIL!;
        legacyAdmin.password = hashPassword(process.env.ADMIN_PASSWORD!);
        upgraded = true;
      }
      const legacyOperator = this.users.find(u => u.id === 'op-1');
      if (legacyOperator && (legacyOperator.password === 'operador123' || !legacyOperator.password?.startsWith('scrypt:'))) {
        legacyOperator.password = hashPassword(crypto.randomBytes(32).toString('hex'));
        upgraded = true;
      }
      if (!this.users.some(u => u.role === 'admin')) {
        this.users.push({ id: `admin-${crypto.randomUUID()}`, name: 'Administrador', email: process.env.ADMIN_EMAIL!, password: hashPassword(process.env.ADMIN_PASSWORD!), role: 'admin', phone: '', origin: 'Ecuador', verified: true, biometricEnabled: false, joinedDate: new Date().toISOString().slice(0, 10) });
        upgraded = true;
      }
    }
    for (const user of this.users) {
      if (user.password && !user.password.startsWith('scrypt:')) {
        user.password = hashPassword(user.password);
        upgraded = true;
      }
    }
    for (const booking of this.bookings) {
      if (!booking.qrCode?.startsWith('BANOS-QR-')) {
        booking.qrCode = `BANOS-QR-${crypto.randomUUID().toUpperCase()}`;
        upgraded = true;
      }
    }
    if (this.reconcileTourCapacity()) upgraded = true;
    if (upgraded || importedLegacyState) {
      await this.persist();
      await this.prisma.dataMigration.upsert({
        where: { id: RELATIONAL_MIGRATION_ID },
        create: { id: RELATIONAL_MIGRATION_ID },
        update: {},
      });
    }
  }

  public async persist(): Promise<void> {
    this.reconcileTourCapacity();
    const save = this.writeQueue.catch(() => {}).then(async () => {
      await this.persistRelationalState();
    });
    this.writeQueue = save;
    await save;
  }

  public async checkConnection(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private reconcileTourCapacity(): boolean {
    const bookedByTour = new Map<string, number>();
    for (const booking of this.bookings) {
      if (booking.status === 'confirmada' || booking.status === 'pendiente') {
        bookedByTour.set(booking.tourId, (bookedByTour.get(booking.tourId) ?? 0) + booking.participants);
      }
    }

    let changed = false;
    for (const tour of this.tours) {
      const currentBooked = bookedByTour.get(tour.id) ?? 0;
      if (tour.currentBooked !== currentBooked) {
        tour.currentBooked = currentBooked;
        changed = true;
      }
    }
    return changed;
  }

  private async loadRelationalState(): Promise<void> {
    const [users, tours, places, bookings, messages, notifications, refreshSessions] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.tour.findMany({ where: { active: true }, include: { operator: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.place.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.booking.findMany({ include: { user: true, tour: { include: { operator: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.chatMessage.findMany({ include: { sender: true }, orderBy: { timestamp: 'asc' } }),
      this.prisma.pushNotification.findMany({ orderBy: { timestamp: 'desc' } }),
      this.prisma.refreshSession.findMany(),
    ]);

    this.users = users.map(user => ({
      id: user.id, name: user.name, email: user.email, password: user.passwordHash,
      role: roleFromDb(user.role), phone: user.phone ?? undefined, origin: user.origin ?? undefined,
      businessType: user.businessType ?? undefined, ruc: user.ruc ?? undefined,
      businessRegistration: user.businessRegistration ?? undefined, department: user.department ?? undefined,
      verified: user.verified, biometricEnabled: user.biometricEnabled,
      biometricKey: user.biometricKey ?? undefined, pushTokens: user.pushTokens,
      language: user.language === 'en' ? 'en' : 'es', pushEnabled: user.pushEnabled,
      avatarUrl: user.avatarUrl ?? undefined, rating: user.rating ?? undefined,
      joinedDate: user.joinedDate.toISOString().slice(0, 10),
    }));
    this.tours = tours.map(tour => ({
      id: tour.id, title: tour.title, operatorId: tour.operatorId, operatorName: tour.operator.name,
      category: tourCategoryFromDb(tour.category), price: Number(tour.price), duration: tour.duration,
      difficulty: tour.difficulty as Tour['difficulty'], rating: tour.rating, reviewsCount: tour.reviewsCount,
      description: tour.description, included: tour.included, imageUrl: tour.imageUrl,
      latitude: tour.latitude, longitude: tour.longitude, availableDays: tour.availableDays,
      maxCapacity: tour.maxCapacity, currentBooked: tour.currentBooked, isOpen: tour.isOpen,
    }));
    this.places = places.map(place => ({
      id: place.id, name: place.name, category: placeCategoryFromDb(place.category), rating: place.rating,
      priceRange: place.priceRange as Place['priceRange'], address: place.address, latitude: place.latitude,
      longitude: place.longitude, description: place.description, imageUrl: place.imageUrl, phone: place.phone,
      tags: place.tags, openingHours: place.openingHours, recommendations: place.recommendations,
      operatorId: place.operatorId ?? undefined, verified: place.verified, active: place.active,
    }));
    this.bookings = bookings.map(booking => ({
      id: booking.id, tourId: booking.tourId, tourTitle: booking.tour.title,
      tourImage: booking.tour.imageUrl, userId: booking.userId, userName: booking.user.name,
      userEmail: booking.user.email, operatorId: booking.tour.operatorId,
      operatorName: booking.tour.operator.name, date: displayBookingDate(booking.date),
      participants: booking.participants, totalPrice: Number(booking.totalPrice),
      status: bookingStatusFromDb(booking.status), qrCode: booking.qrCode,
      encryptedPassport: booking.encryptedPassport && booking.passportIv
        ? { encryptedData: booking.encryptedPassport, iv: booking.passportIv }
        : undefined,
      createdAt: displayCreatedAt(booking.createdAt),
    }));
    this.messages = messages.map(message => ({
      id: message.id, senderId: message.senderId, senderName: message.sender.name,
      senderRole: roleFromDb(message.sender.role), recipientId: message.recipientId,
      tourId: message.tourId ?? undefined, message: message.message,
      timestamp: message.displayTimestamp ?? message.timestamp.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    }));
    this.notifications = notifications.map(notification => ({
      id: notification.id, title: notification.title, body: notification.body,
      targetRole: notification.targetRole as PushNotification['targetRole'],
      type: notification.type as PushNotification['type'],
      timestamp: notification.displayTimestamp ?? notification.timestamp.toISOString(), read: notification.read,
    }));
    this.refreshSessions = refreshSessions.map(session => ({
      tokenHash: session.tokenHash, userId: session.userId, expiresAt: session.expiresAt.getTime(),
    }));
  }

  private async persistRelationalState(): Promise<void> {
    await this.prisma.$transaction(async tx => {
      for (const user of this.users) {
        const data = {
          name: user.name, email: user.email.toLowerCase(), passwordHash: user.password ?? '',
          role: roleToDb(user.role), phone: user.phone, origin: user.origin,
          businessType: user.businessType, ruc: user.ruc, businessRegistration: user.businessRegistration,
          department: user.department, verified: user.verified,
          biometricEnabled: user.biometricEnabled ?? false, biometricKey: user.biometricKey,
          pushTokens: user.pushTokens ?? [], language: user.language ?? 'es',
          pushEnabled: user.pushEnabled ?? true, avatarUrl: user.avatarUrl, rating: user.rating,
          joinedDate: validDate(user.joinedDate),
        };
        await tx.user.upsert({ where: { id: user.id }, create: { id: user.id, ...data }, update: data });
      }

      const tourIds = this.tours.map(tour => tour.id);
      await tx.tour.updateMany({ where: tourIds.length ? { id: { notIn: tourIds } } : {}, data: { active: false } });
      for (const tour of this.tours) {
        const data = {
          title: tour.title, operatorId: tour.operatorId, category: tourCategoryToDb(tour.category),
          price: new Prisma.Decimal(tour.price), duration: tour.duration, difficulty: tour.difficulty,
          rating: tour.rating, reviewsCount: tour.reviewsCount, description: tour.description,
          included: tour.included, imageUrl: tour.imageUrl, latitude: tour.latitude, longitude: tour.longitude,
          availableDays: tour.availableDays, maxCapacity: tour.maxCapacity,
          currentBooked: tour.currentBooked, isOpen: tour.isOpen, active: true,
        };
        await tx.tour.upsert({ where: { id: tour.id }, create: { id: tour.id, ...data }, update: data });
      }

      const placeIds = this.places.map(place => place.id);
      await tx.place.updateMany({ where: placeIds.length ? { id: { notIn: placeIds } } : {}, data: { active: false } });
      for (const place of this.places) {
        const data = {
          name: place.name, category: placeCategoryToDb(place.category), rating: place.rating,
          priceRange: place.priceRange, address: place.address, latitude: place.latitude,
          longitude: place.longitude, description: place.description, imageUrl: place.imageUrl,
          phone: place.phone, tags: place.tags, openingHours: place.openingHours,
          recommendations: place.recommendations, operatorId: place.operatorId,
          verified: place.verified, active: place.active !== false,
        };
        await tx.place.upsert({ where: { id: place.id }, create: { id: place.id, ...data }, update: data });
      }

      const bookingIds = this.bookings.map(booking => booking.id);
      await tx.booking.deleteMany({ where: bookingIds.length ? { id: { notIn: bookingIds } } : {} });
      for (const booking of this.bookings) {
        const data = {
          tourId: booking.tourId, userId: booking.userId, date: validDate(`${booking.date}T00:00:00Z`),
          participants: booking.participants, totalPrice: new Prisma.Decimal(booking.totalPrice),
          status: bookingStatusToDb(booking.status), qrCode: booking.qrCode,
          encryptedPassport: booking.encryptedPassport?.encryptedData,
          passportIv: booking.encryptedPassport?.iv,
          createdAt: validDate(booking.createdAt),
        };
        await tx.booking.upsert({ where: { id: booking.id }, create: { id: booking.id, ...data }, update: data });
      }
      for (const message of this.messages) {
        const data = {
          senderId: message.senderId, recipientId: message.recipientId, tourId: message.tourId,
          message: message.message, displayTimestamp: message.timestamp,
        };
        await tx.chatMessage.upsert({ where: { id: message.id }, create: { id: message.id, ...data }, update: data });
      }
      for (const notification of this.notifications) {
        const data = {
          title: notification.title, body: notification.body, targetRole: notification.targetRole,
          type: notification.type, displayTimestamp: notification.timestamp, read: notification.read ?? false,
        };
        await tx.pushNotification.upsert({ where: { id: notification.id }, create: { id: notification.id, ...data }, update: data });
      }

      const sessionHashes = this.refreshSessions.map(session => session.tokenHash);
      await tx.refreshSession.deleteMany({ where: sessionHashes.length ? { tokenHash: { notIn: sessionHashes } } : {} });
      for (const session of this.refreshSessions) {
        const data = { userId: session.userId, expiresAt: new Date(session.expiresAt) };
        await tx.refreshSession.upsert({ where: { tokenHash: session.tokenHash }, create: { tokenHash: session.tokenHash, ...data }, update: data });
      }
    }, { maxWait: 15_000, timeout: 60_000 });
  }
}

export const db = new DatabaseStore();
