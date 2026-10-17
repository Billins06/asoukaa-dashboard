import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { getAgents, getPendingAgents } from '@/lib/agents/api';
import { parsePageParam } from '@/lib/format';
import { AgentsClient } from './_components/agents-client';
import { AgentsTableSkeleton } from './_components/agents-skeleton';

export const metadata: Metadata = { title: 'Livreurs' };

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab === 'pending' ? 'pending' : 'all';
  const page = parsePageParam(params.page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Livreurs</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Validation et gestion des agents de livraison
        </p>
      </div>

      <Suspense key={`agents-${tab}-${page}`} fallback={<AgentsTableSkeleton />}>
        <AgentsDataServer tab={tab} page={page} />
      </Suspense>
    </div>
  );
}

async function AgentsDataServer({ tab, page }: { tab: string; page: number }) {
  const [allResult, pendingResult] = await Promise.allSettled([
    getAgents(undefined, page, 20),
    getPendingAgents(),
  ]);

  if (allResult.status === 'rejected') {
    const err = allResult.reason;
    unstable_rethrow(err);
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les livreurs : {msg}</span>
      </div>
    );
  }

  if (pendingResult.status === 'rejected') unstable_rethrow(pendingResult.reason);
  const pendingFailed = pendingResult.status === 'rejected';

  return (
    <div className="space-y-4">
      {pendingFailed && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-[13px] text-amber-700 dark:text-amber-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Les candidatures en attente n&apos;ont pas pu être chargées
            {pendingResult.reason instanceof Error ? ` : ${pendingResult.reason.message}` : ''}.
          </span>
        </div>
      )}
      <AgentsClient
        allData={allResult.value}
        pendingData={pendingResult.status === 'fulfilled' ? pendingResult.value : []}
        activeTab={tab}
        currentPage={page}
      />
    </div>
  );
}
