import { API_CONFIG } from './constants';
import { getAccessToken } from './auth';

/**
 * Client HTTP côté SERVEUR (Server Components, Server Actions, Route Handlers).
 *
 * Caractéristiques :
 *  - Attache automatiquement le JWT en Bearer si l'utilisateur est connecté
 *  - Timeout configurable (évite les requêtes zombies)
 *  - Erreurs normalisées
 *  - Pas de cache HTTP par défaut (données admin = toujours fraîches)
 *
 * ⚠️ Ne JAMAIS importer ce fichier depuis un Client Component
 *    → ça expose des secrets, ça plante côté navigateur.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;          // sera JSON.stringify automatiquement si objet
  auth?: boolean;          // par défaut true. false = endpoint public (login...)
  timeout?: number;        // override du timeout
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, auth = true, timeout = API_CONFIG.timeout, headers, ...rest } = options;

  // 1. Construire l'URL
  const url = path.startsWith('http') ? path : `${API_CONFIG.baseUrl}${path}`;

  // 2. Construire les headers
  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  // 3. Timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: rest.cache ?? 'no-store',
    });

    clearTimeout(timeoutId);

    // Parser la réponse
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
      const message =
        (isJson && data && typeof data === 'object' && 'message' in data
          ? Array.isArray((data as { message: unknown }).message)
            ? ((data as { message: string[] }).message).join(', ')
            : String((data as { message: unknown }).message)
          : null) || `Erreur HTTP ${response.status}`;
      throw new ApiError(response.status, data, message);
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, null, 'Délai dépassé. Le serveur ne répond pas.');
    }
    // ⚠️ En prod : envoyer à Sentry. Ne JAMAIS log le token.
    const message = error instanceof Error ? error.message : 'Erreur réseau inconnue';
    throw new ApiError(0, null, message);
  }
}

export const api = {
  get: <T>(path: string, opts?: Omit<FetchOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Omit<FetchOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
