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

export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Pas de cache HTTP : on veut toujours la version fraîche
      cache: 'no-store',
    });

    if (!response.ok) {
      // Token invalide / expiré / utilisateur supprimé
      return null;
    }

    const data = await response.json();
    return data as AdminUser;
  } catch (error) {
    // ⚠️ En prod : envoyer cette erreur à Sentry / Datadog
    // Ne pas log le token, jamais.
    console.error('[getCurrentUser] Backend unreachable:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
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
