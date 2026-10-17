import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { AlertCircle, Info } from 'lucide-react';
import { getPaymentsToReview } from '@/lib/payments/api';
import { parsePageParam } from '@/lib/format';
import { PaymentsToReviewClient } from './_components/payments-to-review-client';
import { PaymentsToReviewSkeleton } from './_components/payments-to-review-skeleton';

export const metadata: Metadata = { title: 'Paiements à examiner' };

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function PaymentsToReviewContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);

  let data: Awaited<ReturnType<typeof getPaymentsToReview>>;
  try {
    data = await getPaymentsToReview({ page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les paiements à examiner : {msg}</span>
      </div>
    );
  }

  return <PaymentsToReviewClient data={data} currentPage={page} />;
}

export default function PaymentsToReviewPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements à examiner</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Clients débités dont la commande n&apos;a pas pu être validée
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-[13px] text-amber-700 dark:text-amber-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Ces clients ont été débités mais leur commande n&apos;a pas pu être validée (stock
          insuffisant ou commande annulée). Un remboursement manuel ou un rejeu est à décider.
        </p>
      </div>
      <Suspense fallback={<PaymentsToReviewSkeleton />}>
        <PaymentsToReviewContent {...props} />
      </Suspense>
    </div>
  );
}
