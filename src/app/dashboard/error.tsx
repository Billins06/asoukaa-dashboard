'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';

/**
 * Erreur dans une page du dashboard : le menu et l'en-tête restent affichés
 * (l'erreur est contenue dans la zone de contenu), l'admin peut réessayer ou
 * naviguer ailleurs.
 */
export default function DashboardError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-10">
      <ErrorPanel
        title="Impossible d'afficher cette page"
        description="Une erreur est survenue pendant le chargement des données. Réessayez ; si le problème continue, vérifiez que le serveur est joignable."
        reference={error.digest}
      >
        <Button onClick={() => (unstable_retry ?? reset)?.()}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Réessayer
        </Button>
      </ErrorPanel>
    </div>
  );
}
