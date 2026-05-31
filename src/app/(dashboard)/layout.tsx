import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getCurrentUser, hasRole } from '@/lib/auth';

/**
 * Layout protégé du dashboard.
 *
 * ⚠️ C'est ICI que se fait la VRAIE protection (pas dans le middleware).
 * Le middleware ne vérifie que la présence du cookie.
 * Ici, on appelle le backend (/auth/me) pour valider le JWT et récupérer
 * les infos de l'utilisateur. Si invalide → redirect /login.
 *
 * Cette vérification est en cache (React.cache dans getCurrentUser), donc
 * une seule requête backend même si plusieurs Server Components l'appellent.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  // Pas connecté ou token invalide
  if (!user) {
    redirect('/login');
  }

  // Double vérification du rôle (le backend devrait déjà filtrer mais on s'assure)
  if (!hasRole(user, 'admin')) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
