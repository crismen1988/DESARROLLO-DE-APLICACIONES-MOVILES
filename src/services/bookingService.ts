import { apiRequest } from './apiClient';
import { Booking } from '../types';
import { isOfflineFailure, readOffline, saveOffline } from './offlineCache';

export interface CreateBookingPayload {
  tourId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  date: string;
  participants: number;
  passportNumber?: string;
}

export interface UpdateBookingPayload {
  date: string;
  participants: number;
}

export const bookingService = {
  async getBookings(params?: { userId?: string; operatorId?: string; role?: string }, cacheScope = 'current'): Promise<Booking[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.operatorId) query.set('operatorId', params.operatorId);
    if (params?.role) query.set('role', params.role);

    const queryString = query.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';
    const cacheKey = `bookings:${cacheScope}`;
    try {
      const bookings = await apiRequest<Booking[]>(endpoint);
      await saveOffline(cacheKey, bookings);
      return bookings;
    } catch (error) {
      if (!isOfflineFailure(error)) throw error;
      const cached = await readOffline<Booking[]>(cacheKey);
      if (!cached) throw error;
      return cached;
    }
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    return apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateBooking(bookingId: string, payload: UpdateBookingPayload): Promise<Booking> {
    return apiRequest<Booking>(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteBooking(bookingId: string): Promise<void> {
    await apiRequest<void>(`/bookings/${bookingId}`, { method: 'DELETE' });
  },

  async updateStatus(bookingId: string, status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada'): Promise<Booking> {
    return apiRequest<Booking>(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};
