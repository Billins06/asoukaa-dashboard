'use client';

import { useSyncExternalStore } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const subscribe = () => () => {};

/**
 * Date affichée en heure LOCALE du navigateur, uniquement une fois hydratée
 * (le serveur peut être dans un autre fuseau → sinon erreur d'hydratation).
 */
export function LocalDate({
  iso,
  pattern = 'd MMM yyyy HH:mm',
  className,
}: {
  iso: string | null | undefined;
  pattern?: string;
  className?: string;
}) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (!iso) return <span className={className}>—</span>;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <span className={className}>—</span>;
  return (
    <time dateTime={d.toISOString()} className={className}>
      {hydrated ? format(d, pattern, { locale: fr }) : '…'}
    </time>
  );
}
