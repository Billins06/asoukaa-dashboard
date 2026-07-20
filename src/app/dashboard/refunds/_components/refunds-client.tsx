'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefundActionDialog } from './refund-action-dialog';
import { formatXOFCompact } from '../../_lib/format';
import type { RefundListItem, RefundStatus, BackendPaginated } from '@/lib/refunds/types';

interface RefundsClientProps {
  data: BackendPaginated<RefundListItem>;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvés' },
  { value: 'REJECTED', label: 'Refusés' },
  { value: 'PROCESSED', label: 'Traités' },
];

const STATUS_STYLES: Record<RefundStatus, string> = {
  PENDING: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
  APPROVED: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
  REJECTED: 'border-destructive/40 text-destructive bg-destructive/5',
  PROCESSED: 'border-blue-500/40 text-blue-600 bg-blue-500/5',
};

const STATUS_LABELS: Record<RefundStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  PROCESSED: 'Traité',
};

function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <Badge variant="outline" className={`text-[11px] ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
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
    return data.data.filter((r) =>
      r.order.orderNumber.toLowerCase().includes(q) ||
      r.motif.toLowerCase().includes(q),
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
              placeholder="N° commande, motif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
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
                            {refund.order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground max-w-[200px]">
                          <p className="truncate">{refund.motif}</p>
                        </td>
                        <td className="px-4 py-3.5 font-medium">
                          {formatXOFCompact(refund.montantRemb)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {format(new Date(refund.dateDemande), 'd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-3.5">
                          <RefundStatusBadge status={refund.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          {refund.status === 'PENDING' && (
                            <div className="flex items-center gap-1.5 justify-end">
                              <RefundActionDialog
                                id={refund.id}
                                orderNumber={refund.order.orderNumber}
                                montantRemb={refund.montantRemb}
                                action="approve"
                              />
                              <RefundActionDialog
                                id={refund.id}
                                orderNumber={refund.order.orderNumber}
                                montantRemb={refund.montantRemb}
                                action="reject"
                              />
                            </div>
                          )}
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
                        {refund.order.orderNumber}
                      </span>
                      <RefundStatusBadge status={refund.status} />
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2">{refund.motif}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium">{formatXOFCompact(refund.montantRemb)}</span>
                      {refund.status === 'PENDING' && (
                        <div className="flex gap-1.5">
                          <RefundActionDialog
                            id={refund.id}
                            orderNumber={refund.order.orderNumber}
                            montantRemb={refund.montantRemb}
                            action="approve"
                          />
                          <RefundActionDialog
                            id={refund.id}
                            orderNumber={refund.order.orderNumber}
                            montantRemb={refund.montantRemb}
                            action="reject"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {data.total} demande{data.total > 1 ? 's' : ''} · Page {currentPage} sur {data.pages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= data.pages}
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
