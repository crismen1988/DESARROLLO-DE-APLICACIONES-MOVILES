import { apiRequest } from './apiClient';
import { Booking } from '../types';

export interface CreateBookingPayload {
  tourId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  date: string;
  participants: number;
  passportNumber?: string;
}

export const bookingService = {
  async getBookings(params?: { userId?: string; operatorId?: string; role?: string }): Promise<Booking[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.operatorId) query.set('operatorId', params.operatorId);
    if (params?.role) query.set('role', params.role);

    const queryString = query.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';
    return apiRequest<Booking[]>(endpoint);
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    return apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(bookingId: string, status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada'): Promise<Booking> {
    return apiRequest<Booking>(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};
