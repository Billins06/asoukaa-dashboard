import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware d'authentification global.
 *
 * Rôle : intercepter toute requête vers une route protégée et vérifier
 * la présence du cookie d'auth. Si absent → redirection vers /login.
 *
 * ⚠️ Important : ici on vérifie UNIQUEMENT la présence du cookie, pas sa
 * validité cryptographique. La vraie validation se fait côté backend
 * NestJS à chaque appel API. Ne JAMAIS faire confiance au middleware
 * comme seule barrière de sécurité — c'est juste un filtre UX rapide
 * pour éviter d'afficher des pages vides.
 *
 * Pour une validation cryptographique optionnelle (si tu veux rejeter
 * un cookie expiré sans aller-retour backend), voir la version
 * commentée en bas avec jose.
 */

const COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || 'asoukaa_access_token';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Routes 100% publiques : /login, /api, assets statiques
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.'); // fichiers statiques (favicon, etc.)

  // Si connecté et essaie d'aller sur /login → renvoyer vers /dashboard
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si non connecté et route protégée → renvoyer vers /login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // On garde l'URL d'origine pour rediriger après login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Configure les chemins sur lesquels le middleware s'exécute.
 * On exclut explicitement les assets statiques pour la performance.
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - api (Route Handlers)
     * - _next/static, _next/image (assets Next.js)
     * - favicon.ico, robots.txt, sitemap.xml
     * - tout chemin contenant un point (= fichier statique)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

/*
 * ─────────────────────────────────────────────────────────────
 * VERSION AVANCÉE (à activer si tu veux valider le JWT côté edge)
 * ─────────────────────────────────────────────────────────────
 *
 * import { jwtVerify } from 'jose';
 *
 * async function verifyJWT(token: string): Promise<boolean> {
 *   try {
 *     // ⚠️ Ne fonctionne QUE si le backend signe avec un secret partagé
 *     // ou si tu fais une JWKS (recommandé pour la prod).
 *     const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
 *     await jwtVerify(token, secret);
 *     return true;
 *   } catch {
 *     return false;
 *   }
 * }
 *
 * À adapter : le secret JWT du backend ne devrait PAS être copié ici.
 * Préférer une JWKS exposée par le backend.
 */
