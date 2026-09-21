import { apiRequest } from './apiClient';
import { PushNotification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<PushNotification[]> {
    return apiRequest<PushNotification[]>('/notifications');
  },

  async broadcast(payload: {
    title: string;
    body: string;
    targetRole?: 'todos' | 'turista' | 'operador';
    type?: 'alerta' | 'promocion' | 'reserva' | 'sistema';
  }): Promise<PushNotification> {
    return apiRequest<PushNotification>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
