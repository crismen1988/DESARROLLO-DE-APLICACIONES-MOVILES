import { apiRequest } from './apiClient';
import { ChatMessage, UserRole } from '../types';

export const chatService = {
  async getMessages(): Promise<ChatMessage[]> {
    return apiRequest<ChatMessage[]>('/messages');
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
