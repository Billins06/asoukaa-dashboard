import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getReviews } from '@/lib/reviews/api';
import { parsePageParam } from '@/lib/format';
import { isReviewStatus, REVIEW_STATUS } from '@/lib/status-meta';
import { ReviewsClient } from './_components/reviews-client';

export const metadata: Metadata = { title: 'Avis' };

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function ReviewsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);

  // Filtre par défaut : les avis « en attente » (c'est le travail du modérateur).
  // « all » = tous les avis ; une valeur inconnue retombe sur le défaut.
  const activeStatus =
    params.status === 'all'
      ? 'all'
      : isReviewStatus(params.status)
        ? params.status
        : REVIEW_STATUS.PENDING;
  const status = activeStatus === 'all' ? undefined : activeStatus;

  let data: Awaited<ReturnType<typeof getReviews>>;
  try {
    data = await getReviews({ status, page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les avis : {msg}</span>
      </div>
    );
  }

  return <ReviewsClient data={data} currentPage={page} activeStatus={activeStatus} />;
}

function ReviewsSkeleton() {
  return (
    <Card><CardContent className="p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-6 py-4 space-y-2 border-b border-border">
          <div className="flex justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-5 w-20" /></div>
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-full max-w-sm" />
          <div className="flex gap-2"><Skeleton className="h-7 w-24" /><Skeleton className="h-7 w-20" /></div>
        </div>
      ))}
    </CardContent></Card>
  );
}

export default function ReviewsPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avis</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Modération des avis produits</p>
      </div>
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsContent {...props} />
      </Suspense>
    </div>
  );
}
