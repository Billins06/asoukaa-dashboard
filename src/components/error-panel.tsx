import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Cartouche d'erreur partagé par app/error.tsx, dashboard/error.tsx et not-found.
 * Composant d'affichage pur (sans état, sans hook) : utilisable dans un composant
 * serveur comme dans un composant client.
 */
export function ErrorPanel({
  title,
  description,
  reference,
  icon,
  children,
  className,
}: {
  title: string;
  description: string;
  /** Référence technique (digest) à communiquer au support, si elle existe. */
  reference?: string;
  icon?: ReactNode;
  /** Boutons d'action. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-sm',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        {icon ?? <AlertTriangle className="h-6 w-6" />}
      </div>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      {reference && (
        <p className="text-xs text-muted-foreground/70">
          Référence : <code className="font-mono">{reference}</code>
        </p>
      )}
      {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
