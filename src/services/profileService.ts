import { apiRequest } from './apiClient';
import type { User, Language } from '../types';
import { isOfflineFailure, readOffline, saveOffline } from './offlineCache';

const PROFILE_CACHE_KEY = 'profile:current';

export const profileService = {
  async get(options: RequestInit = {}): Promise<User> {
    try {
      const user = await apiRequest<User>('/usuarios/perfil', options);
      await saveOffline(PROFILE_CACHE_KEY, user);
      return user;
    } catch (error) {
      if (!isOfflineFailure(error)) throw error;
      const cached = await readOffline<User>(PROFILE_CACHE_KEY);
      if (!cached) throw error;
      return cached;
    }
  },

  async update(profile: Partial<Pick<User, 'name' | 'email' | 'phone' | 'origin' | 'pushEnabled' | 'avatarUrl' | 'businessType' | 'ruc' | 'department' | 'businessRegistration'>> & { language?: Language }): Promise<User> {
    const user = await apiRequest<User>('/usuarios/perfil', { method: 'PUT', body: JSON.stringify(profile) });
    await saveOffline(PROFILE_CACHE_KEY, user);
    return user;
  },

  cache: (user: User) => saveOffline(PROFILE_CACHE_KEY, user),
};
