/**
 * BañosTour - puente con capacidades nativas del dispositivo.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { readOffline, saveOffline } from './offlineCache';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: string;
}

interface DeviceSettingsPlugin {
  getPermissionState(options: { capability: 'location' | 'camera' }): Promise<{ state: RuntimePermissionState }>;
  markPermissionRequested(options: { capability: 'location' | 'camera' }): Promise<void>;
  getLocationServiceState(): Promise<{ enabled: boolean }>;
  getLastKnownLocation(): Promise<{
    available: boolean;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    timestamp?: number;
  }>;
  openAppSettings(): Promise<void>;
  openLocationSettings(): Promise<void>;
}

export type CapabilityFailure =
  | 'permission-required'
  | 'permission-denied'
  | 'permission-blocked'
  | 'service-disabled'
  | 'unavailable'
  | 'timeout';

export type RuntimePermissionState = 'prompt' | 'granted' | 'denied' | 'blocked';

export class NativeCapabilityError extends Error {
  constructor(public readonly reason: CapabilityFailure, message: string) {
    super(message);
    this.name = 'NativeCapabilityError';
  }
}

const DeviceSettings = registerPlugin<DeviceSettingsPlugin>('DeviceSettings');
const LAST_LOCATION_KEY = 'native:last-location';

export function markExpectedNativeInteraction(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('banostour:native-interaction-start'));
}

export function finishExpectedNativeInteraction(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('banostour:native-interaction-end'));
}

export class CapacitorNativeBridge {
  public static async getRuntimePermissionState(capability: 'location' | 'camera'): Promise<RuntimePermissionState> {
    if (!Capacitor.isNativePlatform()) return 'prompt';
    return (await DeviceSettings.getPermissionState({ capability })).state;
  }

  public static async markPermissionRequested(capability: 'location' | 'camera'): Promise<void> {
    if (Capacitor.isNativePlatform()) await DeviceSettings.markPermissionRequested({ capability });
  }

  public static async getLocationPermissionState(): Promise<RuntimePermissionState> {
    if (!Capacitor.isNativePlatform()) return 'prompt';
    return this.getRuntimePermissionState('location');
  }

  public static async requestLocationPermission(): Promise<RuntimePermissionState> {
    if (!Capacitor.isNativePlatform()) return 'granted';
    await Geolocation.requestPermissions();
    await this.markPermissionRequested('location');
    return this.getRuntimePermissionState('location');
  }

  public static async isLocationServiceEnabled(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    return (await DeviceSettings.getLocationServiceState()).enabled;
  }

  public static async openAppSettings(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      markExpectedNativeInteraction();
      await DeviceSettings.openAppSettings();
    }
  }

  public static async openLocationSettings(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      markExpectedNativeInteraction();
      await DeviceSettings.openLocationSettings();
    }
  }

  public static async saveLastLocation(location: DeviceLocation): Promise<void> {
    await saveOffline(LAST_LOCATION_KEY, location);
  }

  public static async getSavedLocation(): Promise<DeviceLocation | null> {
    return readOffline<DeviceLocation>(LAST_LOCATION_KEY);
  }

  private static async getLastKnownNativeLocation(): Promise<DeviceLocation | null> {
    if (!Capacitor.isNativePlatform()) return null;
    const last = await DeviceSettings.getLastKnownLocation();
    if (!last.available || !Number.isFinite(last.latitude) || !Number.isFinite(last.longitude)) return null;
    const timestamp = Number(last.timestamp ?? 0);
    // No reutiliza posiciones antiguas de viajes anteriores.
    if (timestamp > 0 && Date.now() - timestamp > 60 * 60 * 1000) return null;
    return {
      latitude: last.latitude as number,
      longitude: last.longitude as number,
      accuracy: last.accuracy,
      capturedAt: timestamp > 0 ? new Date(timestamp).toISOString() : new Date().toISOString(),
    };
  }

  /** Obtiene la posición sin solicitar permisos de forma inesperada. */
  public static async getCurrentPosition(): Promise<DeviceLocation> {
    if (Capacitor.isNativePlatform()) {
      const permission = await this.getLocationPermissionState();
      if (permission !== 'granted') {
        throw new NativeCapabilityError(
          permission === 'denied' ? 'permission-blocked' : 'permission-required',
          'BañosTour necesita permiso de ubicación para calcular distancias.'
        );
      }
      if (!(await this.isLocationServiceEnabled())) {
        throw new NativeCapabilityError('service-disabled', 'El servicio de ubicación del dispositivo está apagado.');
      }
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 25_000,
          maximumAge: 10 * 60 * 1000,
          enableLocationFallback: true,
        });
        const location: DeviceLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        };
        await this.saveLastLocation(location);
        return location;
      } catch (error) {
        const nativeError = error as { message?: string; code?: string };
        const message = nativeError?.message ?? String(error);
        const code = nativeError?.code ?? '';
        console.warn('No se obtuvo una lectura GPS nueva.', { code, message });
        if (code === 'OS-PLUG-GLOC-0007' || code === 'OS-PLUG-GLOC-0017' || /disabled|location services|proveedor|provider/i.test(message)) {
          throw new NativeCapabilityError('service-disabled', 'El servicio de ubicación del dispositivo está apagado.');
        }
        const lastKnown = await this.getLastKnownNativeLocation();
        if (lastKnown) {
          await this.saveLastLocation(lastKnown);
          return lastKnown;
        }
        if (code === 'OS-PLUG-GLOC-0010' || /timeout|tiempo/i.test(message)) {
          throw new NativeCapabilityError('timeout', 'No fue posible obtener la ubicación a tiempo. Intenta nuevamente cerca de una ventana o al aire libre.');
        }
        throw new NativeCapabilityError('unavailable', 'No fue posible obtener la ubicación del dispositivo.');
      }
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async position => {
            const location: DeviceLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              capturedAt: new Date(position.timestamp).toISOString(),
            };
            await this.saveLastLocation(location);
            resolve(location);
          },
          error => reject(new NativeCapabilityError(
            error.code === error.PERMISSION_DENIED ? 'permission-denied' : 'unavailable',
            error.message
          )),
          { enableHighAccuracy: true, timeout: 10_000 }
        );
      });
    }
    throw new NativeCapabilityError('unavailable', 'La ubicación no está disponible en este dispositivo.');
  }

  public static triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const duration = type === 'light' ? 30 : type === 'medium' ? 60 : 120;
      try {
        navigator.vibrate(duration);
      } catch {
        // La vibración es una mejora opcional.
      }
    }
  }

  public static async isBiometricAvailable(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  }
}
