import { Storage } from '@ionic/storage';

interface CacheEntry<T> {
  savedAt: number;
  data: T;
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
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
