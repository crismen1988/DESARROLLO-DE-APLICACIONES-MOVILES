import { apiRequest } from './apiClient';
import { PushNotification } from '../types';
import { isOfflineFailure, readOffline, saveOffline } from './offlineCache';

export const notificationService = {
  async getNotifications(): Promise<PushNotification[]> {
    try {
      const notifications = await apiRequest<PushNotification[]>('/notifications');
      await saveOffline('notifications', notifications);
      return notifications;
    } catch (error) {
      if (!isOfflineFailure(error)) throw error;
      const cached = await readOffline<PushNotification[]>('notifications');
      if (cached) return cached;
      throw error;
    }
  },

  async broadcast(payload: {
    title: string;
    body: string;
    targetRole?: 'todos' | 'turista' | 'operador';
    type?: 'alerta' | 'promocion' | 'reserva' | 'sistema';
  }): Promise<PushNotification & { delivery: { configured: boolean; sent: number; failed: number } }> {
    return apiRequest<PushNotification & { delivery: { configured: boolean; sent: number; failed: number } }>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
