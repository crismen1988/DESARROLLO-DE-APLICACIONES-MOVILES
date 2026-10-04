import { Storage } from '@ionic/storage';

interface CacheEntry<T> {
  savedAt: number;
  data: T;
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PRIVATE_PREFIXES = ['profile:', 'bookings:', 'messages:', 'admin:', 'notifications'];
const storage = new Storage({ name: '__banostour_offline' });
let ready: Promise<Storage> | null = null;

function getStorage(): Promise<Storage> {
  ready ??= storage.create();
  return ready;
}

export async function saveOffline<T>(key: string, data: T): Promise<void> {
  try {
    await (await getStorage()).set(key, { savedAt: Date.now(), data } satisfies CacheEntry<T>);
  } catch {
    // Storage can be disabled or full; online use remains available.
  }
}

export async function readOffline<T>(key: string): Promise<T | null> {
  try {
    const entry = await (await getStorage()).get(key) as CacheEntry<T> | null;
    if (!entry || !Number.isFinite(entry.savedAt) || Date.now() - entry.savedAt > MAX_AGE_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function isOfflineFailure(error: unknown): boolean {
  return !navigator.onLine || (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === 0
  );
}

export async function clearPrivateOfflineData(): Promise<void> {
  try {
    const database = await getStorage();
    const keys = await database.keys();
    await Promise.all(
      keys
        .filter(key => PRIVATE_PREFIXES.some(prefix => key.startsWith(prefix)))
        .map(key => database.remove(key))
    );
  } catch {
    // Closing the session must continue even if local storage is unavailable.
  }
}
