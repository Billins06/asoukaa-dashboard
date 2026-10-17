import { Skeleton } from '@/components/ui/skeleton';

/**
 * Affiché pendant la navigation entre les pages du dashboard (en attendant les
 * données du serveur). Le menu et l'en-tête restent en place ; seule la zone de
 * contenu montre ce squelette. Les pages qui ont leur propre <Suspense> gardent
 * leur squelette plus précis.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement en cours…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
