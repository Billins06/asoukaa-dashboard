import type { ReactNode } from 'react';

/**
 * Layout du groupe (auth) : centre le contenu, fond dégradé léger.
 * Pas de sidebar ni header → look "page d'accueil" pure.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-orange-50 dark:to-zinc-900 p-4">
      {children}
    </main>
  );
}
