import { apiRequest, TokenStorage } from './apiClient';
import { biometricKey } from './biometricKey';
import type { User } from '../types';
export interface AuthResponse { token: string; user: User; biometricUsed?: boolean; expiresIn?: string; message?: string; }
export interface RegisterPayload { name: string; email: string; password: string; role: 'turista' | 'operador'; phone?: string; origin?: string; businessType?: string; ruc?: string; }
export interface BiometricAccount { userId: string; userName: string; keyId: string; }
const ACCOUNT_KEY = 'banostour_biometric_account_v2';
let biometricAuthPromise: Promise<AuthResponse> | null = null;
const readAccount = (): BiometricAccount | null => { try { const raw = localStorage.getItem(ACCOUNT_KEY); if (!raw) return null; const value = JSON.parse(raw) as BiometricAccount; return value.userId && value.userName && value.keyId ? value : null; } catch { return null; } };
const rememberAccount = (value: BiometricAccount) => localStorage.setItem(ACCOUNT_KEY, JSON.stringify(value));
const forgetBiometricAccount = () => { localStorage.removeItem(ACCOUNT_KEY); localStorage.removeItem('banostour_biometric_account'); };
export const authService = {
  async login(credentials: { email?: string; password?: string; role?: string; biometric?: boolean }): Promise<AuthResponse> { const data = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); if (data.token) TokenStorage.set(data.token); return data; },
  async register(payload: RegisterPayload): Promise<AuthResponse> { const data = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); if (data.token) TokenStorage.set(data.token); return data; },
  async enrollBiometric(user: User): Promise<void> { if (!biometricKey.isAvailable()) return; const key = await biometricKey.enroll(); await apiRequest('/auth/biometric/enroll', { method: 'POST', body: JSON.stringify(key) }); rememberAccount({ userId: user.id, userName: user.name, keyId: key.keyId }); localStorage.removeItem('banostour_biometric_account'); },
  async biometricAuth(): Promise<AuthResponse> {
    // React lifecycle events and rapid taps can request authentication at the
    // same time. Android only permits one CryptoObject biometric prompt, so all
    // callers share the same in-flight challenge instead of opening two prompts.
    if (biometricAuthPromise) return biometricAuthPromise;
    biometricAuthPromise = (async () => {
      const account = readAccount();
      if (!account) throw new Error('Ingresa con correo y contraseña una vez para vincular este dispositivo.');
      const challenge = await apiRequest<{ challengeId: string; challenge: string }>('/auth/biometric', {
        method: 'POST',
        body: JSON.stringify({ action: 'challenge', userId: account.userId, keyId: account.keyId }),
      });
      const signed = await biometricKey.sign(challenge.challenge);
      const data = await apiRequest<AuthResponse>('/auth/biometric', {
        method: 'POST',
        body: JSON.stringify({
          action: 'verify',
          userId: account.userId,
          keyId: account.keyId,
          challengeId: challenge.challengeId,
          signature: signed.signature,
        }),
      });
      if (data.token) TokenStorage.set(data.token);
      return data;
    })();
    try {
      return await biometricAuthPromise;
    } finally {
      biometricAuthPromise = null;
    }
  },
  async unlockOfflineSession(): Promise<void> {
    const account = readAccount();
    if (!account || !TokenStorage.get()) throw new Error('No existe una sesión activa para desbloquear sin conexión.');
    const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
    let challenge = '';
    for (const byte of challengeBytes) challenge += String.fromCharCode(byte);
    challenge = btoa(challenge).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const signed = await biometricKey.sign(challenge);
    if (!signed.signature) throw new Error('No se pudo confirmar la identidad en el dispositivo.');
  },
  forgotPassword: (email: string) => apiRequest<{ success: boolean; message: string; verificationCode?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => apiRequest<{ success: boolean; message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  logout(): void {
    const token = TokenStorage.get();
    forgetBiometricAccount();
    TokenStorage.clear();
    if (biometricKey.isAvailable()) void biometricKey.removeKey().catch(() => {});
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    if (token) void apiRequest('/auth/biometric/revoke', { method: 'POST', headers }).catch(() => {});
    void apiRequest('/auth/logout', { method: 'POST', headers }).catch(() => {});
  },
  getCurrentToken: () => TokenStorage.get(),
  getBiometricAccount: () => readAccount(),
};
