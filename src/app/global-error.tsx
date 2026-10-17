'use client';

import './globals.css';

/**
 * Dernier filet de sécurité : erreur dans le layout racine lui-même.
 * Ce fichier REMPLACE le layout racine : il doit donc fournir <html> et <body>
 * et importer lui-même les styles. Pas de composants de l'application ici
 * (ils dépendent de providers qui n'existent plus à ce stade).
 */
export default function GlobalError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-background text-foreground">
        <title>Erreur</title>
        <main className="flex min-h-screen items-center justify-center p-4">
          <div
            role="alert"
            className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-sm"
          >
            <h1 className="text-lg font-semibold tracking-tight">Une erreur grave est survenue</h1>
            <p className="text-sm text-muted-foreground">
              L&apos;application n&apos;a pas pu s&apos;afficher. Réessayez ; si le problème persiste, rechargez la page ou
              contactez l&apos;équipe technique.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/70">
                Référence : <code className="font-mono">{error.digest}</code>
              </p>
            )}
            <button
              type="button"
              onClick={() => (unstable_retry ?? reset)?.()}
              className="mt-2 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
