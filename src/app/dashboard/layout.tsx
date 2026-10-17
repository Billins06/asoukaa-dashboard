import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getSessionState, hasRole } from '@/lib/auth';
import { SESSION_EXPIRED_ROUTE } from '@/lib/constants';

/**
 * Layout protégé du dashboard.
 *
 * ⚠️ C'est ICI que se fait la VRAIE protection (pas dans le middleware).
 * Le middleware ne vérifie que la présence du cookie.
 * Ici, on appelle le backend (/auth/me) pour valider le JWT et récupérer
 * les infos de l'utilisateur. Si invalide → route /api/session/expired, qui
 * supprime le cookie puis renvoie vers /login?expired=1.
 *
 * Pourquoi pas redirect('/login') directement ? Le cookie durait plus longtemps
 * que le jeton : le middleware voyait un cookie, renvoyait /login vers
 * /dashboard, et le layout renvoyait vers /login : boucle infinie. Et un cookie
 * ne peut pas être supprimé pendant le rendu d'une page, d'où la route dédiée.
 *
 * Serveur injoignable (≠ jeton refusé) : on NE supprime PAS le cookie, on laisse
 * la page d'erreur (app/error.tsx) proposer « Réessayer ».
 *
 * Cette vérification est en cache (React.cache dans getCurrentUser), donc
 * une seule requête backend même si plusieurs Server Components l'appellent.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSessionState();

  // Pas connecté ou token invalide / expiré
  if (session.status === 'unauthenticated') {
    redirect(SESSION_EXPIRED_ROUTE);
  }

  // Backend en panne ou trop lent : la session n'est pas forcément morte.
  if (session.status === 'unavailable') {
    throw new Error('Serveur injoignable');
  }

  const user = session.user;

  // Double vérification du rôle (le backend devrait déjà filtrer mais on s'assure)
  if (!hasRole(user, 'admin')) {
    redirect(SESSION_EXPIRED_ROUTE);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
