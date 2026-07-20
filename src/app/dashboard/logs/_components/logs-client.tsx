'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollText, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { ActivityLog, BackendPaginated, LogActorType, LogResult } from '@/lib/logs/types';

interface LogsClientProps {
  data: BackendPaginated<ActivityLog>;
  currentPage: number;
  view: 'all' | 'failures';
  activeActorType?: string;
  activeResult?: string;
  activeAction?: string;
}

const ACTOR_TYPE_LABELS: Record<LogActorType, string> = {
  ADMIN: 'Admin',
  USER: 'Utilisateur',
  SYSTEM: 'Système',
};

const ACTOR_TYPE_CLASSES: Record<LogActorType, string> = {
  ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  USER: 'bg-gray-50 text-gray-700 border-gray-200',
  SYSTEM: 'bg-purple-50 text-purple-700 border-purple-200',
};

const RESULT_CONFIG: Record<LogResult, { label: string; classes: string; Icon: React.ElementType }> = {
  SUCCESS: { label: 'Succès', classes: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle },
  FAILURE: { label: 'Échec', classes: 'bg-orange-50 text-orange-700 border-orange-200', Icon: XCircle },
  ERROR: { label: 'Erreur', classes: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle },
};

export function LogsClient({ data, currentPage, view, activeActorType, activeResult, activeAction }: LogsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, v);
    });
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const ACTOR_TYPES: LogActorType[] = ['ADMIN', 'USER', 'SYSTEM'];
  const RESULTS: LogResult[] = ['SUCCESS', 'FAILURE', 'ERROR'];

  return (
    <div className="space-y-4">
      {/* Vue tabs */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={view === 'all' ? 'default' : 'outline'}
          className="h-8 text-[13px]"
          onClick={() => {
            const params = new URLSearchParams();
            params.set('view', 'all');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          Tous les logs
        </Button>
        <Button
          size="sm"
          variant={view === 'failures' ? 'default' : 'outline'}
          className="h-8 text-[13px]"
          onClick={() => {
            const params = new URLSearchParams();
            params.set('view', 'failures');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
          Tentatives de connexion
        </Button>
      </div>

      {/* Filtres (seulement sur vue "all") */}
      {view === 'all' && (
        <div className="flex flex-wrap gap-2">
          {/* Acteur */}
          <div className="flex gap-1">
            <Button
              size="sm" variant={!activeActorType ? 'default' : 'outline'}
              className="h-8 text-[12px]"
              onClick={() => push({ actorType: undefined })}
            >
              Tous
            </Button>
            {ACTOR_TYPES.map((t) => (
              <Button
                key={t} size="sm"
                variant={activeActorType === t ? 'default' : 'outline'}
                className="h-8 text-[12px]"
                onClick={() => push({ actorType: t })}
              >
                {ACTOR_TYPE_LABELS[t]}
              </Button>
            ))}
          </div>

          {/* Résultat */}
          <div className="flex gap-1">
            {RESULTS.map((r) => (
              <Button
                key={r} size="sm"
                variant={activeResult === r ? 'default' : 'outline'}
                className="h-8 text-[12px]"
                onClick={() => push({ result: activeResult === r ? undefined : r })}
              >
                {RESULT_CONFIG[r].label}
              </Button>
            ))}
          </div>

          {/* Action (texte) */}
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); push({ action: fd.get('action') as string }); }}>
            <Input
              name="action"
              defaultValue={activeAction ?? ''}
              placeholder="Filtrer par action..."
              className="h-8 text-[13px] w-48"
            />
          </form>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <ScrollText className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun log trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acteur</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Résultat</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entité</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((log) => {
                    const resultCfg = RESULT_CONFIG[log.result as LogResult] ?? RESULT_CONFIG.ERROR;
                    const ResultIcon = resultCfg.Icon;
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono text-[12px] text-foreground">{log.action}</div>
                          {log.description && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">{log.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${ACTOR_TYPE_CLASSES[log.actorType as LogActorType] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}
                          >
                            {ACTOR_TYPE_LABELS[log.actorType as LogActorType] ?? log.actorType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[11px] flex items-center gap-1 w-fit ${resultCfg.classes}`}>
                            <ResultIcon className="h-3 w-3" />
                            {resultCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.entityType ? (
                            <span className="text-[12px]">
                              {log.entityType}
                              {log.entityId && <span className="ml-1 text-[10px] opacity-60">{log.entityId.slice(0, 8)}</span>}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {log.ipAddress ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>{data.total} log{data.total > 1 ? 's' : ''} au total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => goPage(currentPage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[12px]">Page {currentPage} / {data.pages}</span>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={currentPage >= data.pages} onClick={() => goPage(currentPage + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
