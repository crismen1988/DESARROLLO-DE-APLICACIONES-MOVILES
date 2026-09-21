import { apiRequest } from './apiClient';
import type { Place } from '../types';

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

export const communityService = {
  favorites: () => apiRequest<Place[]>('/favoritos'),
  addFavorite: (poiId: string) => apiRequest('/favoritos', { method: 'POST', body: JSON.stringify({ poiId }) }),
  removeFavorite: (poiId: string) => apiRequest(`/favoritos/${encodeURIComponent(poiId)}`, { method: 'DELETE' }),
  reviews: (poiId: string) => apiRequest<PlaceReview[]>(`/resenas?poiId=${encodeURIComponent(poiId)}`),
  addReview: (poiId: string, rating: number, comment: string) => apiRequest<PlaceReview>('/resenas', { method: 'POST', body: JSON.stringify({ poiId, rating, comment }) }),
  updateReview: (id: string, payload: { rating?: number; comment?: string }) => apiRequest<PlaceReview>(`/resenas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  removeReview: (id: string) => apiRequest(`/resenas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  events: () => apiRequest<TouristEvent[]>('/eventos'),
  report: (poiId: string, message: string) => apiRequest('/reportes', { method: 'POST', body: JSON.stringify({ poiId, message }) }),
};
