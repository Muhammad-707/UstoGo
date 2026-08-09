const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://ustogo-backend.onrender.com/api/v1';

const ACCESS_KEY = 'ustogo-access-token';
const REFRESH_KEY = 'ustogo-refresh-token';

// ---- Client-side response caching ----
// Speeds up every request: repeated/parallel GETs to the same endpoint are
// served from memory (2min fresh window) and refreshed in the background
// during the stale window instead of blocking with a full network round-trip.
const DEFAULT_TTL = 120_000;
const MAX_STALE = 5 * 60_000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
  staleAt: number;
}

const cacheStore = new Map<string, CacheEntry>();
const inflightStore = new Map<string, Promise<unknown>>();
const backgroundRefreshes = new Set<string>();

/** Clears the entire in-memory response cache (e.g. on login/logout). */
export function clearApiCache() {
  cacheStore.clear();
}

function refreshInBackground(key: string, fetcher: () => Promise<unknown>): void {
  if (backgroundRefreshes.has(key)) return;
  backgroundRefreshes.add(key);
  fetcher().then(
    () => backgroundRefreshes.delete(key),
    () => backgroundRefreshes.delete(key)
  );
}

const LOCALE_COOKIE = 'ustogo-lang';

/**
 * The locale the user picked in the app (persisted by `i18n/actions.ts`), sent as
 * `X-Locale` so the backend can return translated reference data (categories,
 * cities, master search results). Deliberately not `Accept-Language` — that header
 * reflects the browser/OS setting and would drift from the in-app switcher.
 */
function getLocale(): string {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : 'en';
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

const REFRESH_LOCK_KEY = 'ustogo-refresh-lock';
const REFRESH_LOCK_TTL = 20_000;

/** Lets the app react to a dead session (e.g. redirect to login). */
function notifySessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('ustogo:session-expired'));
}

/**
 * The backend rotates refresh tokens and revokes the whole family when one is
 * reused (REFRESH_TOKEN_REUSED). Two tabs refreshing with the same token would
 * kill the session, so only one tab may run the refresh cycle at a time; the
 * others wait for the rotated token instead of presenting the old one again.
 */
function acquireRefreshLock(): boolean {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (raw) {
      const { at } = JSON.parse(raw) as { at: number };
      if (Number.isFinite(at) && now - at < REFRESH_LOCK_TTL) return false;
    }
  } catch {
    // Corrupt lock — take it over.
  }
  localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ at: now }));
  return true;
}

function releaseRefreshLock(): void {
  localStorage.removeItem(REFRESH_LOCK_KEY);
}

/** Another tab is mid-refresh; wait for the rotated token, then retry. */
async function waitForRefreshLock(): Promise<boolean> {
  const deadline = Date.now() + REFRESH_LOCK_TTL;
  while (Date.now() < deadline) {
    if (localStorage.getItem(REFRESH_LOCK_KEY) === null) {
      return getAccessToken() !== null;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      notifySessionExpired();
      return false;
    }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    notifySessionExpired();
    return false;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /**
   * Overrides the cookie-derived locale. A server component has no `document`, so
   * `getLocale()` there always answers `en` — which is why category and service names
   * rendered on the server came back English whatever language the viewer picked.
   * Server-side callers read the cookie through `next/headers` and pass it in.
   */
  locale?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** false = never use the cache; number = custom TTL in ms (default 30s). */
  cache?: boolean | number;
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// Render's free tier puts the backend to sleep when idle; waking it up can
// take 30-60s, far beyond the default 10s connect timeout. Use a generous
// timeout and retry network failures so the first request "wakes" the server
// instead of crashing with a raw TypeError.
const FETCH_TIMEOUT = 60_000;
const MAX_NETWORK_RETRIES = 3;

async function fetchWithTimeout(fullUrl: string, init: RequestInit): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      return await fetch(fullUrl, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'TimeoutError';
      const isNetwork =
        err instanceof TypeError ||
        (err instanceof Error && /(network|ECONN|ETIMEDOUT|timeout|socket)/i.test(err.message));
      attempt += 1;
      if ((!isNetwork && !isAbort) || attempt > MAX_NETWORK_RETRIES) {
        const message = err instanceof Error ? err.message : 'network error';
        throw new ApiError(0, `Network error: ${message}`, 'NETWORK_ERROR');
      }
      await new Promise((r) => setTimeout(r, attempt * 1_000));
    }
  }
}

async function fetchWithAuth<T>(
  path: string,
  options: RequestOptions,
  fullUrl: string,
  key: string,
  ttl: number,
  shouldStore: boolean,
  retried: boolean
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Locale': options.locale ?? getLocale(),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(fullUrl, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !retried && getRefreshToken()) {
    if (acquireRefreshLock()) {
      try {
        refreshPromise ??= doRefresh().finally(() => {
          refreshPromise = null;
        });
        if (await refreshPromise) {
          return apiRequest<T>(path, options, true);
        }
      } finally {
        releaseRefreshLock();
      }
    } else if (await waitForRefreshLock()) {
      return apiRequest<T>(path, options, true);
    }
    clearTokens();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const err = payload as {
      message?: string;
      error?: string;
      code?: string;
      details?: Array<{ field: string; constraints: string[] }>;
    } | null;
    const detailMessage = Array.isArray(err?.details)
      ? err.details.map((d) => d.constraints?.join(', ')).filter(Boolean).join('; ')
      : undefined;
    throw new ApiError(res.status, detailMessage || err?.message || res.statusText, err?.code ?? err?.error, err?.details);
  }

  if (shouldStore && method === 'GET') {
    const now = Date.now();
    cacheStore.set(key, { data: payload, expiresAt: now + ttl, staleAt: now + MAX_STALE });
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', auth = true } = options;
  const fullUrl = `${API_URL}${path}${buildQuery(options.query)}`;
  const scope = auth ? (getAccessToken() ?? 'anon') : 'public';
  const key = `${scope}|${options.locale ?? getLocale()}|${method}|${fullUrl}`;
  const cache = method === 'GET' && options.cache !== false;
  const ttl = typeof options.cache === 'number' ? options.cache : DEFAULT_TTL;

  // Any write invalidates cached reads so lists reflect new data immediately.
  if (method !== 'GET') {
    clearApiCache();
  }

  if (!retried && cache) {
    const shared = inflightStore.get(key);
    if (shared) return shared as Promise<T>;

    const hit = cacheStore.get(key);
    if (hit) {
      const now = Date.now();
      if (now < hit.expiresAt) return hit.data as T;
      if (now < hit.staleAt) {
        refreshInBackground(key, () => fetchWithAuth<T>(path, options, fullUrl, key, ttl, true, false));
        return hit.data as T;
      }
    }
  }

  const promise = fetchWithAuth<T>(path, options, fullUrl, key, ttl, !retried && cache, retried);
  if (!retried && cache) {
    inflightStore.set(key, promise);
    promise.then(
      () => inflightStore.delete(key),
      () => inflightStore.delete(key)
    );
  }
  return promise;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], auth = true, locale?: string) =>
    apiRequest<T>(path, { method: 'GET', query, auth, ...(locale ? { locale } : {}) }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PATCH', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PUT', body, auth }),
  delete: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'DELETE', auth }),
};
