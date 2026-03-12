import AsyncStorage from '@react-native-async-storage/async-storage';

/** UUID v4-style ID using Math.random (RN-safe; no Node crypto). */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const USER_ID_KEY = 'USER_ID';

let cachedUserId: string | null = null;

/**
 * Returns a persistent install-level user ID (UUID).
 * Generates once on first app launch, stores in AsyncStorage, and caches in memory.
 */
export async function getUserId(): Promise<string> {
  if (cachedUserId) {
    return cachedUserId;
  }

  try {
    const stored = await AsyncStorage.getItem(USER_ID_KEY);
    if (stored) {
      cachedUserId = stored;
      return cachedUserId;
    }
  } catch (e) {
    console.warn('Failed to read USER_ID from AsyncStorage', e);
  }

  const newId = generateUUID();
  try {
    await AsyncStorage.setItem(USER_ID_KEY, newId);
  } catch (e) {
    console.warn('Failed to store USER_ID in AsyncStorage', e);
  }
  cachedUserId = newId;
  return cachedUserId;
}
