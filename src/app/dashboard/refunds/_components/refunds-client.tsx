'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { formatFCFA } from '@/lib/format';
import { REFUND_STATUS, REFUND_STATUS_LIST, refundStatusMeta } from '@/lib/status-meta';
import { RefundActionDialog } from './refund-action-dialog';
import type { RefundListItem, BackendPaginated } from '@/lib/refunds/types';

interface RefundsClientProps {
  data: BackendPaginated<RefundListItem>;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  ...REFUND_STATUS_LIST.map((value) => ({ value, label: refundStatusMeta(value).filterLabel })),
];

function RefundStatusBadge({ status }: { status: string }) {
  const meta = refundStatusMeta(status);
  return (
    <Badge variant="outline" className={cn('text-[11px]', meta.badge)}>
      {meta.label}
    </Badge>
  );
}

function customerName(refund: RefundListItem): string | null {
  const u = refund.order?.user;
  const name = `${u?.prenom ?? ''} ${u?.name ?? ''}`.trim();
  return name || null;
}

/**
 * « en attente » : Approuver / Refuser. « approuvé » : Marquer comme traité
 * (argent rendu à la main). Les autres statuts : aucune action (le serveur refuserait).
 */
function RefundActions({ refund }: { refund: RefundListItem }) {
  const orderNumber = refund.order?.orderNumber ?? '—';
  if (refund.status === REFUND_STATUS.APPROVED) {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <RefundActionDialog
          id={refund.id}
          orderNumber={orderNumber}
          montantRemb={refund.montantRemb}
          action="processed"
        />
      </div>
    );
  }
  if (refund.status !== REFUND_STATUS.PENDING) return null;
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <RefundActionDialog
        id={refund.id}
        orderNumber={orderNumber}
        montantRemb={refund.montantRemb}
        action="approve"
      />
      <RefundActionDialog
        id={refund.id}
        orderNumber={orderNumber}
        montantRemb={refund.montantRemb}
        action="reject"
      />
    </div>
  );
}

export function RefundsClient({ data, currentPage, activeStatus }: RefundsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const setStatus = (s: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('status', s);
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  };

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(p));
    router.push(url.pathname + url.search);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter(
      (r) =>
        (r.order?.orderNumber ?? '').toLowerCase().includes(q) ||
        (r.motif ?? '').toLowerCase().includes(q) ||
        (customerName(r) ?? '').toLowerCase().includes(q),
    );
  }, [data.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={activeStatus === f.value ? 'default' : 'outline'}
            className="h-8 text-[12px]"
            aria-pressed={activeStatus === f.value}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="N° commande, client, motif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
          {search.trim() && data.pages > 1 && (
            <p className="text-[11px] text-muted-foreground">
              La recherche porte uniquement sur les demandes de cette page.
            </p>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <RotateCcw className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun remboursement trouvé</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Commande</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Motif</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Montant</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((refund) => (
                      <tr key={refund.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-mono text-[12px] font-medium">
                            {refund.order?.orderNumber ?? '—'}
                          </span>
                          {customerName(refund) && (
                            <p className="text-[11px] text-muted-foreground">{customerName(refund)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground max-w-[200px]">
                          <p className="truncate" title={refund.motif ?? undefined}>{refund.motif || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                          {formatFCFA(refund.montantRemb)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <LocalDate iso={refund.dateDemande} pattern="d MMM yyyy" />
                        </td>
                        <td className="px-4 py-3.5">
                          <RefundStatusBadge status={refund.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <RefundActions refund={refund} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-border">
                {filtered.map((refund) => (
                  <div key={refund.id} className="px-4 py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-medium">
                        {refund.order?.orderNumber ?? '—'}
                      </span>
                      <RefundStatusBadge status={refund.status} />
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2">{refund.motif || '—'}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium">{formatFCFA(refund.montantRemb)}</span>
                      <RefundActions refund={refund} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {data.total > 0 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {data.total} demande{data.total > 1 ? 's' : ''} · Page {currentPage} sur {Math.max(1, data.pages)}
              </p>
              {data.pages > 1 && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Page précédente"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Page suivante"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= data.pages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
