import { redirect } from 'next/navigation';
import { API_CONFIG, SESSION_EXPIRED_ROUTE } from './constants';
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
  /**
   * Par défaut (true) : une réponse 401 sur un appel authentifié = session morte →
   * redirection vers la route qui supprime le cookie (évite la boucle
   * /login <-> /dashboard). Mettre false pour un Route Handler consommé par fetch()
   * côté navigateur, qui doit recevoir l'erreur 401 telle quelle.
   */
  redirectOn401?: boolean;
  timeout?: number;        // override du timeout
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, auth = true, redirectOn401 = true, timeout = API_CONFIG.timeout, headers, ...rest } = options;

  // 1. Construire l'URL
  const url = path.startsWith('http') ? path : `${API_CONFIG.baseUrl}${path}`;

  // 2. Construire les headers
  // Content-Type uniquement si la requête a un body (GET/DELETE n'en ont pas)
  const finalHeaders: HeadersInit = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
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
      const rawMsg =
        isJson && data && typeof data === 'object' && 'message' in data
          ? (data as { message: unknown }).message
          : null;
      const message = rawMsg === null || rawMsg === undefined
        ? `Erreur HTTP ${response.status}`
        : Array.isArray(rawMsg)
        ? (rawMsg as unknown[]).map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).join(', ')
        : typeof rawMsg === 'string'
        ? rawMsg || `Erreur HTTP ${response.status}`
        : JSON.stringify(rawMsg);
      throw new ApiError(response.status, data, message);
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      // Le redirect() est volontairement lancé ICI, hors du bloc try : dans le try il
      // aurait été rattrapé par ce même catch et transformé en erreur réseau.
      if (error.status === 401 && auth && redirectOn401) redirect(SESSION_EXPIRED_ROUTE);
      throw error;
    }
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
