/**
 * BañosTour Backend Domain Models & DTOs
 * Mirrored with PostgreSQL / Prisma ORM schema
 */

export type UserRole = 'turista' | 'operador' | 'admin';

export interface RefreshSession {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

export interface Favorite {
  userId: string;
  poiId: string;
  addedAt: string;
}

export interface PlaceReview {
  id: string;
  userId: string;
  poiId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface TouristEvent {
  id: string;
  operatorId: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  active: boolean;
}

export interface PlaceReport {
  id: string;
  userId: string;
  poiId: string;
  message: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  origin?: string;
  businessType?: string;
  ruc?: string;
  businessRegistration?: string;
  department?: string;
  verified: boolean;
  biometricEnabled?: boolean;
  biometricKey?: string;
  joinedDate: string;
  rating?: number;
  language?: 'es' | 'en';
  pushEnabled?: boolean;
  avatarUrl?: string;
}

export interface Tour {
  id: string;
  title: string;
  operatorId: string;
  operatorName: string;
  category: 'Aventura' | 'Cascadas' | 'Relax' | 'Naturaleza' | 'Cultura';
  price: number;
  duration: string;
  difficulty: 'Fácil' | 'Moderado' | 'Exigente';
  rating: number;
  reviewsCount: number;
  description: string;
  included: string[];
  imageUrl: string;
  latitude: number;
  longitude: number;
  availableDays: string[];
  maxCapacity: number;
  currentBooked: number;
  isOpen: boolean;
}

export interface Place {
  id: string;
  name: string;
  category: 'Comida' | 'Hotel' | 'Hostal' | 'Hostería' | 'Termas';
  rating: number;
  priceRange: '$' | '$$' | '$$$';
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  phone: string;
  tags: string[];
  operatorId?: string;
  verified: boolean;
  active?: boolean;
}

export interface EncryptedData {
  iv: string;
  encryptedData: string;
}

export interface Booking {
  id: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  userId: string;
  userName: string;
  userEmail: string;
  operatorId: string;
  operatorName: string;
  date: string;
  participants: number;
  totalPrice: number;
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
  qrCode: string;
  encryptedPassport?: EncryptedData;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  tourId?: string;
  message: string;
  timestamp: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  targetRole: 'todos' | 'turista' | 'operador';
  type: 'alerta' | 'promocion' | 'reserva' | 'sistema';
  timestamp: string;
  read?: boolean;
}

export interface RedisCacheStats {
  hits: number;
  misses: number;
  keysCached: number;
  avgLatencyMs: number;
  status: string;
}
