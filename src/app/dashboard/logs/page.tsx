import { Suspense } from 'react';
import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { AlertCircle, ScrollText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getLogs, getLoginFailures } from '@/lib/logs/api';
import { parsePageParam } from '@/lib/format';
import { isLogActorType, isLogResult, isLogAction } from '@/lib/status-meta';
import { LogsClient } from './_components/logs-client';

export const metadata: Metadata = { title: "Journal d'activité" };

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
  const page = parsePageParam(params.page);

  // Le serveur refuse (erreur 400) toute valeur hors liste : on ne transmet
  // que des valeurs connues, le reste est ignoré.
  const actorType = isLogActorType(params.actorType) ? params.actorType : undefined;
  const result = isLogResult(params.result) ? params.result : undefined;
  const action = isLogAction(params.action) ? params.action : undefined;

  let data: Awaited<ReturnType<typeof getLogs>>;
  try {
    data = view === 'failures'
      ? await getLoginFailures(page)
      : await getLogs({ actorType, result, action, page, limit: 20 });
  } catch (error) {
    // Une session expirée déclenche une redirection (exception spéciale de Next) :
    // on la laisse passer au lieu de l'afficher comme une erreur.
    unstable_rethrow(error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Impossible de charger le journal d&apos;activité : {msg}</span>
      </div>
    );
  }

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
            Historique des actions effectuées sur la plateforme (conservé 1 an)
          </p>
        </div>
      </div>
      <Suspense fallback={<LogsSkeleton />}>
        <LogsContent {...props} />
      </Suspense>
    </div>
  );
}
