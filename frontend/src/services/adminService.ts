import { apiRequest } from './apiClient';
import { User, AnalyticsData } from '../types';

export const adminService = {
  async getUsers(): Promise<User[]> {
    return apiRequest<User[]>('/admin/users');
  },

  async verifyUser(userId: string, verified: boolean): Promise<User> {
    return apiRequest<User>(`/admin/users/${userId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  },

  async getAnalytics(): Promise<AnalyticsData> {
    return apiRequest<AnalyticsData>('/admin/analytics');
  },
};
