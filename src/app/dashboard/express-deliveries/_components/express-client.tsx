'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Zap, AlertTriangle, Undo2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LocalDate } from '@/components/local-date';
import { formatFCFA } from '@/lib/format';
import { ExpressDetailButton } from './express-detail-dialog';
import { StatusBadge } from './express-status-badge';
import type { ExpressPage } from '@/lib/express-deliveries/types';

interface Filters {
  q: string;
  status: string;
  payment: string;
  refund: string;
  attention: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'en attente', label: 'En attente d\'un livreur' },
  { value: 'contre-proposition', label: 'Contre-proposition' },
  { value: 'paiement en attente', label: 'Paiement en attente' },
  { value: 'accepté', label: 'Payées (livreur en route)' },
  { value: 'en cours de livraison', label: 'En cours de livraison' },
  { value: 'livré', label: 'Livrées' },
  { value: 'annulée', label: 'Annulées' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'Tous les paiements' },
  { value: 'à vérifier', label: 'À vérifier' },
  { value: 'en attente', label: 'En attente' },
  { value: 'success', label: 'Payés' },
  { value: 'échoué', label: 'Échoués' },
  { value: 'none', label: 'Sans paiement' },
];

const selectClass =
  'h-9 rounded-md border border-input bg-background px-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring';

const DELAI_LABEL: Record<string, string> = {
  normal: 'Dans la journée',
  urgent: '2 à 3 h',
  express: 'Moins d\'1 h',
};

export function ExpressClient({ data, filters }: { data: ExpressPage; filters: Filters }) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);

  const push = (changes: Partial<Filters & { page: string }>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(changes)) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    if (!('page' in changes)) url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  };

  return (
    <div className="space-y-4">
      {(data.toReview > 0 || data.toRefund > 0) && (
        <div className="flex flex-wrap gap-3">
          {data.toReview > 0 && (
            <button
              type="button"
              onClick={() => push({ payment: 'à vérifier', status: '', refund: '', attention: '' })}
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive hover:bg-destructive/10"
            >
              <AlertTriangle className="h-4 w-4" />
              {data.toReview} paiement{data.toReview > 1 ? 's' : ''} à vérifier
            </button>
          )}
          {data.toRefund > 0 && (
            <button
              type="button"
              onClick={() => push({ refund: 'à rembourser', status: '', payment: '', attention: '' })}
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive hover:bg-destructive/10"
            >
              <Undo2 className="h-4 w-4" />
              {data.toRefund} remboursement{data.toRefund > 1 ? 's' : ''} à faire
            </button>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <form
              className="relative w-full sm:w-64"
              onSubmit={(e) => {
                e.preventDefault();
                push({ q: q.trim() });
              }}
            >
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Client, livreur, adresse, n°…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8 h-9 text-[13px]"
                aria-label="Rechercher une course"
              />
            </form>
            <select
              className={selectClass}
              value={filters.status}
              onChange={(e) => push({ status: e.target.value })}
              aria-label="Filtrer par statut"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={filters.payment}
              onChange={(e) => push({ payment: e.target.value })}
              aria-label="Filtrer par paiement"
            >
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                checked={filters.refund === 'à rembourser'}
                onChange={(e) => push({ refund: e.target.checked ? 'à rembourser' : '' })}
              />
              À rembourser
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Zap className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune course trouvée</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Date</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Client</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Livreur</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Prix</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.data.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <LocalDate iso={d.createdAt} />
                          <p className="text-[11px] text-muted-foreground">{DELAI_LABEL[d.delai] ?? d.delai}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{d.requester?.name ?? '—'}</p>
                          <p className="text-[11px] text-muted-foreground">{d.requester?.phone ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{d.agent?.name ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">
                          {formatFCFA(d.price ?? d.proposedPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge d={d} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <ExpressDetailButton id={d.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y divide-border">
                {data.data.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{d.requester?.name ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {d.agent?.name ?? 'Sans livreur'} · {formatFCFA(d.price ?? d.proposedPrice)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <LocalDate iso={d.createdAt} /> · {DELAI_LABEL[d.delai] ?? d.delai}
                      </p>
                      <div className="mt-1">
                        <StatusBadge d={d} />
                      </div>
                    </div>
                    <ExpressDetailButton id={d.id} />
                  </div>
                ))}
              </div>
            </>
          )}

          {(data.pages > 1 || data.page > 1) && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {data.total} course{data.total > 1 ? 's' : ''} · Page {data.page} sur {data.pages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => push({ page: String(Math.max(1, data.page - 1)) })}
                  disabled={data.page <= 1}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => push({ page: String(data.page + 1) })}
                  disabled={data.page >= data.pages}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
