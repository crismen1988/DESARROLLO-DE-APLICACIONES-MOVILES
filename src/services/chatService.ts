import { apiRequest } from './apiClient';
import { ChatMessage, UserRole } from '../types';
import { isOfflineFailure, readOffline, saveOffline } from './offlineCache';

export const chatService = {
  async getMessages(cacheScope = 'current'): Promise<ChatMessage[]> {
    const cacheKey = `messages:${cacheScope}`;
    try {
      const messages = await apiRequest<ChatMessage[]>('/messages');
      await saveOffline(cacheKey, messages);
      return messages;
    } catch (error) {
      if (!isOfflineFailure(error)) throw error;
      const cached = await readOffline<ChatMessage[]>(cacheKey);
      if (!cached) throw error;
      return cached;
    }
  },

  async sendMessage(payload: {
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    recipientId: string;
    message: string;
    tourId?: string;
  }): Promise<ChatMessage> {
    return apiRequest<ChatMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
