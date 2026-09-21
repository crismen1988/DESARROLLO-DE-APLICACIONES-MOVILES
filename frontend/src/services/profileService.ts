import { apiRequest } from './apiClient';
import type { User, Language } from '../types';

export const profileService = {
  get: (options: RequestInit = {}) => apiRequest<User>('/usuarios/perfil', options),
  update: (profile: Partial<Pick<User, 'name' | 'email' | 'phone' | 'origin' | 'pushEnabled' | 'avatarUrl' | 'businessType' | 'ruc' | 'department' | 'businessRegistration'>> & { language?: Language }) =>
    apiRequest<User>('/usuarios/perfil', { method: 'PUT', body: JSON.stringify(profile) }),
};
