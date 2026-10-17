import { AlertCircle } from 'lucide-react';

/**
 * Message d'erreur affiché DANS la page (liste impossible à charger…), sans casser
 * le reste de l'écran. Composant d'affichage pur : utilisable côté serveur et client.
 */
export function InlineError({ title, message }: { title: string; message?: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {message && <p className="mt-0.5 break-words text-destructive/90">{message}</p>}
      </div>
    </div>
  );
}

/** Texte lisible d'une erreur inconnue (jamais la pile technique). */
export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Erreur inconnue';
}
