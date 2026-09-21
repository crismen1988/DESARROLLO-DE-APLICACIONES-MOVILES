import { apiRequest } from './apiClient';
import { Place } from '../types';
import { readOffline, saveOffline } from './offlineCache';

export const placeService = {
  async getPlaces(category?: string): Promise<Place[]> {
    const query = category && category !== 'Todos' ? `?category=${encodeURIComponent(category)}` : '';
    try {
      const places = await apiRequest<Place[]>(`/places${query}`);
      if (!query) await saveOffline('places', places);
      return places;
    } catch (error) {
      const cached = await readOffline<Place[]>('places');
      if (!cached) throw error;
      return category && category !== 'Todos' ? cached.filter(place => place.category === category) : cached;
    }
  },

  async createPlace(placeData: Partial<Place>): Promise<Place> {
    return apiRequest<Place>('/places', {
      method: 'POST',
      body: JSON.stringify(placeData),
    });
  },
};
