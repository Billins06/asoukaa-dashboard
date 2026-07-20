import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AlertCircle, ScrollText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getLogs, getLoginFailures } from '@/lib/logs/api';
import { LogsClient } from './_components/logs-client';
import type { LogActorType, LogResult } from '@/lib/logs/types';

export const metadata: Metadata = { title: "Journal d'activité" };

const VALID_ACTOR_TYPES: LogActorType[] = ['ADMIN', 'USER', 'SYSTEM'];
const VALID_RESULTS: LogResult[] = ['SUCCESS', 'FAILURE', 'ERROR'];

interface PageProps {
  searchParams: Promise<{
    view?: string;
    actorType?: string;
    result?: string;
    action?: string;
    page?: string;
  }>;
}

async function LogsContent({ searchParams }: PageProps) {
  const params = await searchParams;

  const view = params.view === 'failures' ? 'failures' : 'all';
  const page = Math.max(1, Number(params.page ?? '1'));

  const actorType = VALID_ACTOR_TYPES.includes(params.actorType as LogActorType)
    ? (params.actorType as LogActorType)
    : undefined;
  const result = VALID_RESULTS.includes(params.result as LogResult)
    ? (params.result as LogResult)
    : undefined;
  const action = params.action?.trim() || undefined;

  try {
    const data = view === 'failures'
      ? await getLoginFailures(page)
      : await getLogs({ actorType, result, action, page, limit: 20 });

    return (
      <LogsClient
        data={data}
        currentPage={page}
        view={view}
        activeActorType={actorType}
        activeResult={result}
        activeAction={action}
      />
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger les logs : {msg}</span>
      </div>
    );
  }
}

function LogsSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function LogsPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;activité</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Toutes les actions effectuées sur la plateforme
          </p>
        </div>
      </div>
      <Suspense fallback={<LogsSkeleton />}>
        <LogsContent {...props} />
      </Suspense>
    </div>
  );
}
