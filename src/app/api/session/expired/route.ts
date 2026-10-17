import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/constants';

// Jamais mis en cache : la réponse dépend du cookie et en supprime un.
export const dynamic = 'force-dynamic';

/**
 * Fin de session : supprime le cookie d'authentification puis renvoie vers
 * /login?expired=1.
 *
 * Pourquoi une route et pas un simple redirect('/login') dans le layout ?
 *  - Le JWT admin vit 1 jour. Quand il est mort, le cookie (encore présent)
 *    faisait croire au middleware que l'admin est connecté : /login renvoyait
 *    vers /dashboard, dont le layout renvoyait vers /login... boucle infinie.
 *  - Un cookie ne peut PAS être modifié pendant le rendu d'une page (Server
 *    Component / layout) : seule une route ou une action serveur peut le faire.
 *
 * Le paramètre `expired=1` est la seule exception où le middleware laisse
 * afficher /login même si un cookie est encore présent (il est supprimé ici
 * dans la même réponse, mais le navigateur peut avoir déjà lancé la requête).
 *
 * L'adresse de redirection est RELATIVE (en-tête Location) : derrière un proxy
 * inverse, l'origine vue par Next peut être interne (localhost:3002) et
 * produirait une redirection vers une adresse injoignable.
 */
export async function GET() {
  const response = new NextResponse(null, {
    status: 307,
    headers: {
      Location: '/login?expired=1',
      'Cache-Control': 'no-store',
    },
  });

  // Mêmes attributs (path, sameSite, secure) que lors de la pose du cookie :
  // sinon certains navigateurs ne reconnaissent pas le cookie à supprimer.
  response.cookies.set(AUTH_COOKIE.name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
