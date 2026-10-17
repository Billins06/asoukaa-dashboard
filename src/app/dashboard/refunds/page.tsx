import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect, unstable_rethrow } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { getRefunds } from '@/lib/refunds/api';
import { parsePageParam } from '@/lib/format';
import { isRefundStatus } from '@/lib/status-meta';
import { RefundsClient } from './_components/refunds-client';
import { RefundsSkeleton } from './_components/refunds-skeleton';

export const metadata: Metadata = { title: 'Remboursements' };

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function RefundsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  // Valeur EXACTE du serveur (« en attente », « rejetté »…) ou « all ».
  const status = isRefundStatus(params.status) ? params.status : undefined;

  let data: Awaited<ReturnType<typeof getRefunds>>;
  try {
    data = await getRefunds({ status, page, limit: 20 });
  } catch (error) {
    unstable_rethrow(error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les remboursements : {msg}</span>
      </div>
    );
  }

  // Page hors limites (ex. ?page=9 alors qu'il n'y en a que 2, ou après un filtre) :
  // on renvoie vers la dernière page existante au lieu d'une liste vide trompeuse.
  if (data.pages > 0 && page > data.pages) {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    if (data.pages > 1) qs.set('page', String(data.pages));
    redirect(`/dashboard/refunds${qs.size ? `?${qs.toString()}` : ''}`);
  }

  return <RefundsClient data={data} currentPage={page} activeStatus={status ?? 'all'} />;
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
