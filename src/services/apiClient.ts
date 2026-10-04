/**
 * BañosTour Frontend API Client
 * Centralizes HTTP communication with the NestJS backend (/api),
 * automatically attaches JWT Authorization headers, and standardizes error responses.
 */

import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  // En desarrollo nativo se usa localhost junto con `adb reverse tcp:3000 tcp:3000`.
  // Para WiFi o producción, VITE_API_BASE_URL debe contener la URL pública de la API.
  if (Capacitor.isNativePlatform()) {
    return 'http://localhost:3000/api';
  }
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
let refreshPromise: Promise<string | null> | null = null;
const NETWORK_RETRY_DELAYS_MS = [250, 750];

const waitForNetworkRetry = (delayMs: number, signal?: AbortSignal): Promise<void> => new Promise((resolve, reject) => {
  const timeout = window.setTimeout(resolve, delayMs);
  signal?.addEventListener('abort', () => {
    window.clearTimeout(timeout);
    reject(signal.reason ?? new DOMException('La solicitud fue cancelada.', 'AbortError'));
  }, { once: true });
});

function renewAccessToken(): Promise<string | null> {
  refreshPromise ??= fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async response => response.ok ? (await response.json() as { token: string }).token : null)
    .catch(() => null)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Token storage helper in localStorage with memory fallback
 */
class TokenStorage {
  private static readonly KEY = 'banostour_jwt_token';
  private static memoryToken: string | null = null;

  public static get(): string | null {
    try {
      return localStorage.getItem(this.KEY) || this.memoryToken;
    } catch {
      return this.memoryToken;
    }
  }

  public static set(token: string): void {
    this.memoryToken = token;
    try {
      localStorage.setItem(this.KEY, token);
    } catch {}
  }

  public static clear(): void {
    this.memoryToken = null;
    try {
      localStorage.removeItem(this.KEY);
    } catch {}
  }
}

export { TokenStorage };

/**
 * Core Request wrapper
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  
  // Set default Content-Type for JSON payloads
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Inject JWT token if stored
  const token = TokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    let response: Response;
    for (let attempt = 0; ; attempt += 1) {
      try {
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
        break;
      } catch (error) {
        if (attempt >= NETWORK_RETRY_DELAYS_MS.length || options.signal?.aborted) throw error;
        await waitForNetworkRetry(NETWORK_RETRY_DELAYS_MS[attempt], options.signal ?? undefined);
      }
    }

    if (response.status === 401 && token && !endpoint.startsWith('/auth/')) {
      const renewedToken = await renewAccessToken();
      if (renewedToken) {
        TokenStorage.set(renewedToken);
        headers.set('Authorization', `Bearer ${renewedToken}`);
        response = await fetch(url, { ...options, headers, credentials: 'include' });
      } else {
        TokenStorage.clear();
      }
    }

    const contentType = response.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<!doctype')) {
        throw new ApiError(`Servidor respondió con formato no esperado (${response.status})`, response.status, text);
      }
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage = data && typeof data === 'object' && data.error 
        ? data.error 
        : `Error ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('No se pudo conectar al servidor. Verifica tu conexión a internet.', 0);
  }
}
