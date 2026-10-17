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
  // 1 jour : le JWT admin expire au bout de 1 jour côté serveur (JWT_EXPIRES_IN=1d).
  // Un cookie plus durable que le jeton laissait l'admin « connecté » avec un jeton
  // mort (boucle /login <-> /dashboard). À l'ouverture de session on aligne en plus
  // la durée sur le vrai `exp` du jeton (voir loginAction).
  maxAge: parseInt(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE || '86400', 10) || 86400,
} as const;

/**
 * Route qui supprime le cookie de session puis renvoie vers /login?expired=1.
 * Un cookie ne peut pas être modifié pendant le rendu d'une page : toute
 * détection de session morte (layout, réponse 401) redirige donc vers cette route.
 */
export const SESSION_EXPIRED_ROUTE = '/api/session/expired';

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
