import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getCommissions, getCommissionStats } from '@/lib/commissions/api';
import { CommissionsClient } from './_components/commissions-client';
import type { CommissionStatus } from '@/lib/commissions/types';

export const metadata: Metadata = { title: 'Commissions' };

const VALID_STATUSES: CommissionStatus[] = ['PENDING', 'PAID'];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function CommissionsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawStatus = params.status ?? 'all';
  const page = Math.max(1, Number(params.page ?? '1'));
  const status = VALID_STATUSES.includes(rawStatus as CommissionStatus)
    ? (rawStatus as CommissionStatus)
    : undefined;

  try {
    const [data, stats] = await Promise.all([
      getCommissions({ status, page, limit: 20 }),
      getCommissionStats(),
    ]);
    return <CommissionsClient data={data} stats={stats} currentPage={page} activeStatus={rawStatus} />;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les commissions : {msg}</span>
      </div>
    );
  }
}

function CommissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-32" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
            <Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-28 hidden sm:block" /><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-14" /><Skeleton className="h-8 w-24 ml-auto" />
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

export default function CommissionsPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Suivi des commissions Asoukaa par vendeur</p>
        </div>
      </div>
      <Suspense fallback={<CommissionsSkeleton />}>
        <CommissionsContent {...props} />
      </Suspense>
    </div>
  );
}
