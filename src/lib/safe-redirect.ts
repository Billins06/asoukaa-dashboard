/**
 * Redirection post-connexion sûre (anti « open redirect »).
 *
 * Le paramètre `?redirect=` est contrôlable par n'importe qui (lien piégé) : s'il
 * contenait `https://site-pirate.com` ou `//site-pirate.com`, l'admin fraîchement
 * connecté serait envoyé sur un site externe imitant le dashboard.
 *
 * On n'accepte donc qu'un chemin INTERNE du dashboard :
 *  - commence par `/dashboard` (et pas `/dashboardxyz` : fin de chemin, `/`, `?` ou `#`) ;
 *  - ne commence pas par `//` ni ne contient `\` (certains navigateurs lisent `\` comme `/`) ;
 *  - n'a pas de `:` avant le premier `/` (schéma `javascript:`, `https:`…) ;
 *  - ne contient aucun caractère de contrôle (retours à la ligne, tabulations…).
 * Tout le reste retombe sur `/dashboard`.
 */
export const DEFAULT_REDIRECT = '/dashboard';

export function getSafeRedirect(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2000) return DEFAULT_REDIRECT;
  if (!/^\/dashboard(?:[/?#]|$)/.test(value)) return DEFAULT_REDIRECT;
  if (value.startsWith('//') || value.includes('\\')) return DEFAULT_REDIRECT;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return DEFAULT_REDIRECT;
  const firstSlash = value.indexOf('/');
  const colon = value.indexOf(':');
  if (colon !== -1 && colon < firstSlash) return DEFAULT_REDIRECT;
  return value;
}
