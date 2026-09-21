import { apiRequest } from './apiClient';

export interface ArchitectureData {
  prismaModels: Array<{ name: string; fields: string[] }>;
  redisCache: {
    hits: number;
    misses: number;
    keysCached: number;
    avgLatencyMs: number;
    status: string;
  };
}

export const securityService = {
  async encrypt(plainText: string): Promise<{ iv: string; encryptedData: string }> {
    return apiRequest('/security/encrypt', {
      method: 'POST',
      body: JSON.stringify({ plainText }),
    });
  },

  async decrypt(encryptedData: string, iv: string): Promise<{ decryptedText: string }> {
    return apiRequest('/security/decrypt', {
      method: 'POST',
      body: JSON.stringify({ encryptedData, iv }),
    });
  },

  async getHealth(): Promise<any> {
    return apiRequest('/health');
  },

  async getArchitecture(): Promise<ArchitectureData> {
    return apiRequest('/system/architecture');
  },
};
