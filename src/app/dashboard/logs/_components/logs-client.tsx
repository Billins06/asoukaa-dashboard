'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ScrollText, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import {
  LOG_ACTIONS,
  LOG_ACTOR_TYPE_LIST,
  LOG_RESULT,
  LOG_RESULT_LIST,
  logActorTypeMeta,
  logResultMeta,
} from '@/lib/status-meta';
import type { ActivityLog, BackendPaginated } from '@/lib/logs/types';

interface LogsClientProps {
  data: BackendPaginated<ActivityLog>;
  currentPage: number;
  view: 'all' | 'failures';
  activeActorType?: string;
  activeResult?: string;
  activeAction?: string;
}

const SELECT_CLASS =
  'h-8 rounded-md border border-input bg-background px-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-ring';

/** Affiche un objet JSON de façon lisible, sans jamais planter (valeur circulaire, texte…). */
function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? '';
  } catch {
    return String(value);
  }
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

function LogDetails({ log }: { log: ActivityLog }) {
  const showOld = hasContent(log.oldValue);
  const showNew = hasContent(log.newValue);
  if (!showOld && !showNew) return null;
  return (
    <details className="mt-1 group">
      <summary className="cursor-pointer select-none text-[11px] text-primary hover:underline">
        Voir les détails
      </summary>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {showOld && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avant</p>
            <pre className="mt-0.5 max-h-48 overflow-auto rounded-md bg-muted/50 p-2 text-[11px] leading-snug whitespace-pre-wrap break-all">
              {prettyJson(log.oldValue)}
            </pre>
          </div>
        )}
        {showNew && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Après</p>
            <pre className="mt-0.5 max-h-48 overflow-auto rounded-md bg-muted/50 p-2 text-[11px] leading-snug whitespace-pre-wrap break-all">
              {prettyJson(log.newValue)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

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
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilter = Boolean(activeActorType || activeResult || activeAction);

  return (
    <div className="space-y-4">
      {/* Vue : tout le journal, ou seulement les échecs de connexion */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={view === 'all' ? 'default' : 'outline'}
          className="h-8 text-[13px]"
          aria-pressed={view === 'all'}
          onClick={() => router.push(pathname)}
        >
          Tout le journal
        </Button>
        <Button
          size="sm"
          variant={view === 'failures' ? 'default' : 'outline'}
          className="h-8 text-[13px]"
          aria-pressed={view === 'failures'}
          onClick={() => router.push(`${pathname}?view=failures`)}
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
          Échecs de connexion
        </Button>
      </div>

      {/* Filtres (uniquement sur la vue complète) */}
      {view === 'all' && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtrer par acteur"
            className={SELECT_CLASS}
            value={activeActorType ?? ''}
            onChange={(e) => push({ actorType: e.target.value || undefined })}
          >
            <option value="">Tous les acteurs</option>
            {LOG_ACTOR_TYPE_LIST.map((t) => (
              <option key={t} value={t}>{logActorTypeMeta(t).label}</option>
            ))}
          </select>

          <select
            aria-label="Filtrer par résultat"
            className={SELECT_CLASS}
            value={activeResult ?? ''}
            onChange={(e) => push({ result: e.target.value || undefined })}
          >
            <option value="">Tous les résultats</option>
            {LOG_RESULT_LIST.map((r) => (
              <option key={r} value={r}>{logResultMeta(r).label}</option>
            ))}
          </select>

          {/* Le serveur n'accepte que les actions de cette liste : pas de saisie libre. */}
          <select
            aria-label="Filtrer par action"
            className={cn(SELECT_CLASS, 'max-w-[18rem]')}
            value={activeAction ?? ''}
            onChange={(e) => push({ action: e.target.value || undefined })}
          >
            <option value="">Toutes les actions</option>
            {LOG_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {hasFilter && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[12px]"
              onClick={() => push({ actorType: undefined, result: undefined, action: undefined })}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      )}

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <ScrollText className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {view === 'failures'
                  ? 'Aucun échec de connexion enregistré'
                  : hasFilter
                    ? 'Aucune entrée ne correspond à ces filtres'
                    : "Le journal d'activité est vide"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acteur</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Résultat</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Élément concerné</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Adresse IP</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((log) => {
                    const actor = logActorTypeMeta(log.actorType);
                    const res = logResultMeta(log.result);
                    const ResultIcon = log.result === LOG_RESULT.SUCCESS ? CheckCircle : XCircle;
                    return (
                      <tr key={log.id} className="align-top hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 max-w-[22rem]">
                          <div className="text-[13px] font-medium text-foreground">{log.action}</div>
                          {log.errorMessage && (
                            <div className="mt-0.5 text-[11px] text-destructive break-words">{log.errorMessage}</div>
                          )}
                          <LogDetails log={log} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn('text-[11px]', actor.badge)}>
                            {actor.label}
                          </Badge>
                          {log.actorId && (
                            <div className="mt-1 font-mono text-[10px] text-muted-foreground" title={log.actorId}>
                              {log.actorId.slice(0, 8)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn('text-[11px] flex items-center gap-1 w-fit', res.badge)}>
                            <ResultIcon className="h-3 w-3" />
                            {res.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.entityType ? (
                            <span className="text-[12px]">
                              {log.entityType}
                              {log.entityId && (
                                <span className="ml-1 font-mono text-[10px] opacity-70" title={log.entityId}>
                                  {log.entityId.slice(0, 8)}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {log.ipAddress ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <LocalDate iso={log.createdAt} pattern="d MMM yyyy HH:mm" />
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
      {data.total > 0 && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>{formatNumber(data.total)} entrée{data.total > 1 ? 's' : ''} au total</span>
          {data.pages > 1 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="Page précédente" disabled={currentPage <= 1} onClick={() => goPage(currentPage - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[12px]">Page {currentPage} / {data.pages}</span>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="Page suivante" disabled={currentPage >= data.pages} onClick={() => goPage(currentPage + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
