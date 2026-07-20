import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { getAgents, getPendingAgents } from '@/lib/agents/api';
import type { AgentPendingItem } from '@/lib/agents/types';
import { AgentsClient } from './_components/agents-client';
import { AgentsTableSkeleton } from './_components/agents-skeleton';

export const metadata: Metadata = { title: 'Livreurs' };

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab === 'pending' ? 'pending' : 'all';
  const page = Math.max(1, Number(params.page) || 1);

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
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les livreurs : {msg}</span>
      </div>
    );
  }

  const pendingData = pendingResult.status === 'fulfilled'
    ? Array.isArray(pendingResult.value)
      ? pendingResult.value
      : ((pendingResult.value as { data?: AgentPendingItem[] })?.data ?? [])
    : [] as AgentPendingItem[];

  return (
    <AgentsClient
      allData={allResult.value}
      pendingData={pendingData}
      activeTab={tab}
      currentPage={page}
    />
  );
}
