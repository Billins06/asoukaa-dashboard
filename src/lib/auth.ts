import { cookies } from 'next/headers';
import { AUTH_COOKIE } from './constants';
import type { AdminUser } from '@/types/auth';

/**
 * Helpers d'authentification — SERVER-SIDE UNIQUEMENT.
 *
 * Tout ce qui touche aux cookies httpOnly doit passer par next/headers.
 * Ne jamais importer ce fichier depuis un Client Component, ça plantera.
 */

/**
 * Lit le token d'accès depuis le cookie httpOnly.
 * Retourne undefined si l'utilisateur n'est pas connecté.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE.name)?.value;
}

/**
 * Récupère le profil de l'admin connecté depuis le backend.
 *
 * Retourne null si non connecté ou si le token est invalide.
 * Le middleware filtre déjà les routes, mais ce check côté serveur
 * est la VRAIE barrière de sécurité (le middleware ne valide pas le JWT).
 *
 * ⚠️ Avant production :
 *  - Mettre en cache la réponse (React.cache) pour éviter d'appeler /auth/me
 *    à chaque Server Component qui en a besoin sur la même requête
 */
import { cache } from 'react';
import { API_CONFIG } from './constants';

/**
 * État de la session, en distinguant 3 cas qu'un simple « null » mélangeait :
 *  - `ok`              : jeton valide, utilisateur chargé ;
 *  - `unauthenticated` : pas de cookie, ou jeton refusé (401/403 : expiré, révoqué,
 *                        admin désactivé) → il faut se reconnecter ;
 *  - `unavailable`     : serveur injoignable / en erreur (5xx, délai dépassé) → la
 *                        session n'est PAS forcément morte : il ne faut surtout pas
 *                        supprimer le cookie, juste afficher une erreur « Réessayer ».
 */
export type SessionState =
  | { status: 'ok'; user: AdminUser }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' };

export const getSessionState = cache(async (): Promise<SessionState> => {
  const token = await getAccessToken();
  if (!token) return { status: 'unauthenticated' };

  // Même délai maximal que lib/api.ts : un backend qui ne répond pas ne doit pas
  // bloquer le rendu indéfiniment.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Pas de cache HTTP : on veut toujours la version fraîche
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      // Token invalide / expiré / admin supprimé ou désactivé
      return { status: 'unauthenticated' };
    }
    if (!response.ok) {
      return { status: 'unavailable' };
    }

    const data = (await response.json().catch(() => null)) as AdminUser | null;
    if (!data || typeof data !== 'object') return { status: 'unavailable' };
    return { status: 'ok', user: data };
  } catch (error) {
    clearTimeout(timeoutId);
    // ⚠️ En prod : envoyer cette erreur à Sentry / Datadog
    // Ne pas log le token, jamais.
    console.error('[getSessionState] Backend unreachable:', error instanceof Error ? error.message : 'unknown');
    return { status: 'unavailable' };
  }
});

/** Compatibilité : null si non connecté OU serveur injoignable (voir getSessionState). */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const state = await getSessionState();
  return state.status === 'ok' ? state.user : null;
});

/**
 * Vérifie que l'utilisateur a un rôle suffisant.
 * À utiliser dans les Server Components / pages protégées par rôle.
 */
export function hasRole(user: AdminUser | null, requiredRole: 'admin' | 'superadmin'): boolean {
  if (!user) return false;
  if (requiredRole === 'superadmin') return user.role === 'superadmin';
  return user.role === 'admin' || user.role === 'superadmin';
}
