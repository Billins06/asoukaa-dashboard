import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/**
 * En-têtes de sécurité appliqués à toutes les pages et routes du dashboard.
 *
 * Content-Security-Policy VOLONTAIREMENT MINIMALE : seulement les directives qui
 * n'interfèrent pas avec le fonctionnement de Next.js (scripts et styles en ligne,
 * hydratation, polices Google, images venant du serveur d'envoi de fichiers…).
 * On n'ajoute donc PAS de `script-src`, `style-src` ni `img-src` : sans nonce, ils
 * casseraient la page. Ce qu'on bloque ici :
 *  - frame-ancestors 'none' : le dashboard ne peut être affiché dans aucune iframe
 *    (clickjacking), en complément de X-Frame-Options ;
 *  - base-uri 'self'        : une balise <base> injectée ne peut pas détourner les liens ;
 *  - form-action 'self'     : un formulaire ne peut être envoyé qu'à notre propre site ;
 *  - object-src 'none'      : aucun plugin <object>/<embed>.
 */
const CSP = "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // Le lien d'invitation /set-password contient un jeton : ne jamais le laisser fuiter
  // dans l'en-tête Referer vers un autre site.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()',
  },
  { key: 'Content-Security-Policy', value: CSP },
  // HSTS uniquement en production : en développement (http://localhost) il forcerait
  // le navigateur à exiger du HTTPS sur localhost pendant un an.
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
];

const nextConfig: NextConfig = {
  // Ne pas annoncer « X-Powered-By: Next.js » : inutile pour un attaquant qui cherche
  // des failles liées à la techno.
  poweredByHeader: false,

  // images.remotePatterns : volontairement absent. Le dashboard affiche les images avec
  // de simples balises <img> (aucun usage de next/image), donc aucun hôte distant n'a
  // à être autorisé — surtout pas de joker du type `hostname: '**'`. Si next/image est
  // adopté un jour, lister UNIQUEMENT les hôtes exacts (stockage Supabase du projet).

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
