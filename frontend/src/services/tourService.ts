import { apiRequest } from './apiClient';
import { Tour } from '../types';
import { readOffline, saveOffline } from './offlineCache';

export const tourService = {
  async getTours(params?: { category?: string; search?: string; operatorId?: string }): Promise<Tour[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'Todos') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.operatorId) query.set('operatorId', params.operatorId);

    const queryString = query.toString();
    const endpoint = queryString ? `/tours?${queryString}` : '/tours';
    try {
      const tours = await apiRequest<Tour[]>(endpoint);
      if (!queryString) await saveOffline('tours', tours);
      return tours;
    } catch (error) {
      const cached = await readOffline<Tour[]>('tours');
      if (!cached) throw error;
      return cached.filter(tour =>
        (!params?.category || params.category === 'Todos' || tour.category === params.category) &&
        (!params?.operatorId || tour.operatorId === params.operatorId) &&
        (!params?.search || `${tour.title} ${tour.description}`.toLowerCase().includes(params.search.toLowerCase()))
      );
    }
  },

  async createTour(tourData: Partial<Tour>): Promise<Tour> {
    return apiRequest<Tour>('/tours', {
      method: 'POST',
      body: JSON.stringify(tourData),
    });
  },

  async updateAvailability(tourId: string, payload: { isOpen?: boolean; maxCapacity?: number }): Promise<Tour> {
    return apiRequest<Tour>(`/tours/${tourId}/availability`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateTour(tourId: string, tourData: Partial<Tour>): Promise<Tour> {
    return apiRequest<Tour>(`/tours/${tourId}`, {
      method: 'PUT',
      body: JSON.stringify(tourData),
    });
  },

  async deleteTour(tourId: string): Promise<void> {
    await apiRequest<void>(`/tours/${tourId}`, { method: 'DELETE' });
  },
};
