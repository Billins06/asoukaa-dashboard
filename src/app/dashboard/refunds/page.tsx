import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { getRefunds } from '@/lib/refunds/api';
import { RefundsClient } from './_components/refunds-client';
import { RefundsSkeleton } from './_components/refunds-skeleton';
import type { RefundStatus } from '@/lib/refunds/types';

export const metadata: Metadata = { title: 'Remboursements' };

const VALID_STATUSES: RefundStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function RefundsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawStatus = params.status ?? 'all';
  const page = Math.max(1, Number(params.page ?? '1'));
  const status = VALID_STATUSES.includes(rawStatus as RefundStatus)
    ? (rawStatus as RefundStatus)
    : undefined;

  try {
    const data = await getRefunds({ status, page, limit: 20 });
    return <RefundsClient data={data} currentPage={page} activeStatus={rawStatus} />;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les remboursements : {msg}</span>
      </div>
    );
  }
}

export default function RefundsPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Remboursements</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Traitement des demandes de remboursement clients
        </p>
      </div>
      <Suspense fallback={<RefundsSkeleton />}>
        <RefundsContent {...props} />
      </Suspense>
    </div>
  );
}
