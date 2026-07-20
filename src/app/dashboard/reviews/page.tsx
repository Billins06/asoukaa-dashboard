import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getReviews } from '@/lib/reviews/api';
import { ReviewsClient } from './_components/reviews-client';
import type { ReviewStatus } from '@/lib/reviews/types';

export const metadata: Metadata = { title: 'Avis' };

const VALID_STATUSES: ReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function ReviewsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawStatus = params.status ?? 'PENDING';
  const page = Math.max(1, Number(params.page ?? '1'));
  const status = VALID_STATUSES.includes(rawStatus as ReviewStatus)
    ? (rawStatus as ReviewStatus)
    : undefined;

  try {
    const data = await getReviews({ status, page, limit: 20 });
    return <ReviewsClient data={data} currentPage={page} activeStatus={rawStatus} />;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les avis : {msg}</span>
      </div>
    );
  }
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
