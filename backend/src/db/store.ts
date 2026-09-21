import { Tour, Place, Booking, ChatMessage, PushNotification, User, RefreshSession, Favorite, PlaceReview, TouristEvent, PlaceReport } from '../types';
import { encryptAES256 } from '../security/encryption';
import { Prisma, PrismaClient } from '@prisma/client';
import { hashPassword } from '../security/password';
import crypto from 'crypto';

/**
 * BañosTour Central In-Memory Database Store
 * Simulates a PostgreSQL 16 database accessed via Prisma ORM.
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
type StoredState = Pick<DatabaseStore, 'users' | 'tours' | 'places' | 'bookings' | 'messages' | 'notifications' | 'refreshSessions' | 'favorites' | 'placeReviews' | 'events' | 'reports'>;

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
  public favorites: Favorite[] = [];
  public placeReviews: PlaceReview[] = [];
  public events: TouristEvent[] = [];
  public reports: PlaceReport[] = [];
  public recoveryCodes: Record<string, { code: string; expiresAt: number }> = {};

  public async initialize(): Promise<void> {
    if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)) {
      throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) antes de iniciar producción');
    }
    const state = await this.prisma.appState.findUnique({ where: { id: 'main' } });
    if (state) {
      const saved = state.data as unknown as StoredState;
      this.users = saved.users;
      this.tours = saved.tours;
      this.places = saved.places;
      this.bookings = saved.bookings;
      this.messages = saved.messages;
      this.notifications = saved.notifications;
      this.refreshSessions = saved.refreshSessions ?? [];
      this.favorites = saved.favorites ?? [];
      this.placeReviews = saved.placeReviews ?? [];
      this.events = saved.events ?? [];
      this.reports = saved.reports ?? [];
    }
    let upgraded = !state;
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
    if (upgraded) await this.persist();
  }

  public async persist(): Promise<void> {
    const save = this.writeQueue.catch(() => {}).then(async () => {
      const data: Prisma.InputJsonValue = JSON.parse(JSON.stringify({
        users: this.users,
        tours: this.tours,
        places: this.places,
        bookings: this.bookings,
        messages: this.messages,
        notifications: this.notifications,
        refreshSessions: this.refreshSessions,
        favorites: this.favorites,
        placeReviews: this.placeReviews,
        events: this.events,
        reports: this.reports,
      }));
      await this.prisma.appState.upsert({
        where: { id: 'main' },
        create: { id: 'main', data },
        update: { data },
      });
    });
    this.writeQueue = save;
    await save;
  }

  public async checkConnection(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}

export const db = new DatabaseStore();
