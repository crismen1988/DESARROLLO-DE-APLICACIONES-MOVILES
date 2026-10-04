import { apiRequest } from './apiClient';
import { User, AnalyticsData } from '../types';
import { isOfflineFailure, readOffline, saveOffline } from './offlineCache';

export const adminService = {
  async getUsers(): Promise<User[]> {
    try {
      const users = await apiRequest<User[]>('/admin/users');
      await saveOffline('admin:users', users);
      return users;
    } catch (error) {
      if (!isOfflineFailure(error)) throw error;
      const cached = await readOffline<User[]>('admin:users');
      if (!cached) throw error;
      return cached;
    }
  },

  async verifyUser(userId: string, verified: boolean): Promise<User> {
    return apiRequest<User>(`/admin/users/${userId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  },

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const analytics = await apiRequest<AnalyticsData>('/admin/analytics');
      await saveOffline('admin:analytics', analytics);
      return analytics;
    } catch (error) {
      if (!isOfflineFailure(error)) throw error;
      const cached = await readOffline<AnalyticsData>('admin:analytics');
      if (!cached) throw error;
      return cached;
    }
  },
};
