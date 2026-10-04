export type UserRole = 'turista' | 'operador' | 'admin';

export type Language = 'es' | 'en';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  origin?: string;
  businessType?: string;
  ruc?: string;
  businessRegistration?: string;
  department?: string;
  verified: boolean;
  biometricEnabled?: boolean;
  joinedDate: string;
  rating?: number;
  language?: Language;
  pushEnabled?: boolean;
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
  distanceKm?: number;
}

export interface Place {
  id: string;
  name: string;
  category: 'Comida' | 'Hotel' | 'Hostal' | 'Hostería' | 'Airbnb' | 'Termas' | 'Mirador';
  rating: number;
  priceRange: '$' | '$$' | '$$$';
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  phone: string;
  tags: string[];
  openingHours: string;
  recommendations: string[];
  operatorId?: string;
  verified: boolean;
  distanceKm?: number;
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
  encryptedPassport?: { iv: string; encryptedData: string };
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

export interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    activeTourists: number;
    totalTours: number;
    totalBookings: number;
    pendingApprovals: number;
    satisfactionRate: string;
  };
  monthlyVisitors: Array<{ month: string; tourists: number; revenue: number }>;
  popularAttractions: Array<{ name: string; share: number; icon: string }>;
  securityAudit: {
    jwtAlgorithm: string;
    encryptionStandard: string;
    biometricCompliance: string;
    dataPrivacyStandard: string;
  };
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  name: string;
}
