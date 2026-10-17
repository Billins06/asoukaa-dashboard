'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';

/**
 * Page d'erreur générale (hors /dashboard, et erreurs du layout du dashboard :
 * un error.tsx ne protège pas le layout de SON propre segment, d'où ce fichier à la racine).
 *
 * Cas typique : le serveur Asoukaa ne répond pas pendant le chargement du dashboard.
 * Le cookie de session n'est PAS supprimé : « Réessayer » suffit dès que le serveur revient.
 */
export default function RootError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    // En production le message est masqué par Next : seul le digest permet de retrouver
    // l'erreur dans les journaux du serveur.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ErrorPanel
        title="Une erreur est survenue"
        description="La page n'a pas pu se charger. Le serveur est peut-être momentanément injoignable : réessayez dans un instant."
        reference={error.digest}
      >
        <Button onClick={() => (unstable_retry ?? reset)?.()}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Réessayer
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Retour au tableau de bord</a>
        </Button>
      </ErrorPanel>
    </main>
  );
}
