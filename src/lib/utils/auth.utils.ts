const TOKEN_KEY = "tasktrust.auth.token";
const EXPIRY_KEY = "tasktrust.auth.expiry";

const getStorages = (): Storage[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const storages: Storage[] = [];
  try {
    storages.push(window.localStorage);
  } catch (_error) {
    // ignore
  }
  try {
    storages.push(window.sessionStorage);
  } catch (_error) {
    // ignore
  }
  return storages;
};

const removeFromStorage = (storage: Storage) => {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(EXPIRY_KEY);
};

export const persistAuthToken = (token: string, rememberMe: boolean) => {
  if (typeof window === "undefined" || !token) {
    return;
  }

  const expiry = new Date();
  const targetStorage = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;

  if (rememberMe) {
    expiry.setMonth(expiry.getMonth() + 1);
  } else {
    expiry.setHours(expiry.getHours() + 12);
  }

  try {
    removeFromStorage(otherStorage);
  } catch (_error) {
    // ignore
  }

  try {
    targetStorage.setItem(TOKEN_KEY, token);
    targetStorage.setItem(EXPIRY_KEY, expiry.toISOString());
  } catch (error) {
    console.error("Failed to persist auth token:", error);
  }
};

export const getStoredAuthToken = (): string | null => {
  const storages = getStorages();
  if (!storages.length) {
    return null;
  }

  const now = new Date();

  for (const storage of storages) {
    try {
      const token = storage.getItem(TOKEN_KEY);
      if (!token) {
        continue;
      }
      const expiryValue = storage.getItem(EXPIRY_KEY);
      if (expiryValue) {
        const expiry = new Date(expiryValue);
        if (Number.isNaN(expiry.getTime()) || expiry < now) {
          removeFromStorage(storage);
          continue;
        }
      }
      return token;
    } catch (error) {
      console.warn("Failed to read auth token:", error);
    }
  }

  return null;
};

export const clearStoredAuthToken = () => {
  const storages = getStorages();
  storages.forEach((storage) => {
    try {
      removeFromStorage(storage);
    } catch (_error) {
      // ignore
    }
  });
};

export const isAuthenticated = () => !!getStoredAuthToken();

const decodeBase64Url = (input: string) => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    return atob(padded);
  } catch (error) {
    console.error("Failed to decode base64 token segment:", error);
    return "";
  }
};

export const parseAuthTokenPayload = <T = Record<string, any>>(
  token?: string | null
): T | null => {
  if (!token) {
    return null;
  }
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }
  try {
    const payload = decodeBase64Url(segments[1]);
    return JSON.parse(payload) as T;
  } catch (error) {
    console.error("Failed to parse auth token payload:", error);
    return null;
  }
};

export const getAuthenticatedUserFromToken = <
  T = Record<string, any>
>(): T | null => {
  const token = getStoredAuthToken();
  return parseAuthTokenPayload<T>(token);
};

export const AUTH_TOKEN_STORAGE_KEYS = {
  token: TOKEN_KEY,
  expiry: EXPIRY_KEY,
} as const;

export const getAuthToken = (): string | null => {
  return getStoredAuthToken();
};

