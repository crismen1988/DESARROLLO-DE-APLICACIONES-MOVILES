import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import type { PushNotification } from '../types';
import { apiRequest } from './apiClient';

const TOKEN_KEY = 'banostour_push_token';

function toDomainNotification(notification: PushNotificationSchema): PushNotification {
  return {
    id: String(notification.data?.notificationId || notification.id || `push-${Date.now()}`),
    title: notification.title || 'BañosTour',
    body: notification.body || '',
    targetRole: 'todos',
    type: (notification.data?.type as PushNotification['type']) || 'sistema',
    timestamp: 'Justo ahora',
    read: false,
  };
}

export const nativePushService = {
  async initialize(onNotification: (notification: PushNotification) => void): Promise<() => Promise<void>> {
    if (!Capacitor.isNativePlatform()) return async () => {};

    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') return async () => {};

    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'banostour_alertas',
        name: 'Promociones y eventos de BañosTour',
        description: 'Alertas turísticas, promociones y eventos relevantes.',
        importance: 4,
        visibility: 1,
        vibration: true,
      });
    }

    const registration = await PushNotifications.addListener('registration', (token: Token) => {
      localStorage.setItem(TOKEN_KEY, token.value);
      void apiRequest('/notifications/device', {
        method: 'POST',
        body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
      }).catch(error => console.error('No se pudo registrar el dispositivo para notificaciones:', error));
    });
    const registrationError = await PushNotifications.addListener('registrationError', error => {
      console.error('Error de registro de notificaciones push:', error);
    });
    const received = await PushNotifications.addListener('pushNotificationReceived', notification => {
      onNotification(toDomainNotification(notification));
    });
    const action = await PushNotifications.addListener('pushNotificationActionPerformed', (event: ActionPerformed) => {
      onNotification(toDomainNotification(event.notification));
    });

    await PushNotifications.register();
    return async () => {
      await Promise.all([registration.remove(), registrationError.remove(), received.remove(), action.remove()]);
    };
  },

  async unregisterCurrentDevice(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await apiRequest('/notifications/device', { method: 'DELETE', body: JSON.stringify({ token }) });
    localStorage.removeItem(TOKEN_KEY);
  },
};
