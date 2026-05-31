/**
 * Constantes de configuration de l'app dashboard.
 *
 * Ce fichier est importé partout. Toute valeur "magique" qui revient
 * dans plusieurs fichiers doit être ici.
 */

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Asoukaa Admin',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
} as const;

/**
 * Configuration du cookie d'authentification.
 *
 * ⚠️ Production checklist :
 * - `secure: true` est obligatoire en HTTPS (déjà géré dynamiquement)
 * - `httpOnly: true` non négociable (sinon XSS = vol du token)
 * - `sameSite: 'lax'` suffit pour la protection CSRF basique
 */
export const AUTH_COOKIE = {
  name: process.env.ACCESS_TOKEN_COOKIE_NAME || 'asoukaa_access_token',
  maxAge: parseInt(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE || '604800', 10), // 7j
} as const;

/**
 * Configuration API backend.
 *
 * ⚠️ Production : utiliser l'URL HTTPS du backend.
 */
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 15_000, // 15s — au-delà on coupe (évite les requêtes zombies)
} as const;

/**
 * Rôles autorisés sur le dashboard.
 * (le client/vendor/livreur n'ont PAS accès à l'admin)
 */
export const DASHBOARD_ROLES = ['admin', 'superadmin'] as const;
export type DashboardRole = (typeof DASHBOARD_ROLES)[number];
