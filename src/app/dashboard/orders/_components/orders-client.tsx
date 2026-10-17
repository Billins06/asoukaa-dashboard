'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Gavel, TriangleAlert } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { formatFCFA } from '@/lib/format';
import {
  ORDER_STATUS_LIST,
  nextOrderStatuses,
  orderStatusMeta,
} from '@/lib/status-meta';
import { OrderStatusDialog } from './order-status-dialog';
import { DisputeCloseDialog } from './dispute-close-dialog';
import type { OrderListItem, BackendPaginated } from '@/lib/orders/types';

interface OrdersClientProps {
  data: BackendPaginated<OrderListItem>;
  currentPage: number;
  activeStatus: string;
  /** true = la liste est limitée aux commandes avec un litige ouvert. */
  disputeOnly: boolean;
}

// « all » + tous les statuts du serveur, dans l'ordre du parcours d'une commande.
const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  ...ORDER_STATUS_LIST.map((value) => ({ value, label: orderStatusMeta(value).filterLabel })),
];

function OrderStatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta(status);
  return (
    <Badge variant="outline" className={cn('text-[11px]', meta.badge)}>
      {meta.label}
    </Badge>
  );
}

/** Pastille « Litige » sous le statut d'une commande contestée par le client. */
function DisputeBadge({ order }: { order: OrderListItem }) {
  if (order.disputeOuverte !== true) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
      <TriangleAlert className="h-3 w-3" />
      Litige ouvert
    </p>
  );
}

/** Bouton « Clore le litige » : seulement si le client a ouvert un litige sur cette commande. */
function DisputeAction({ order, size }: { order: OrderListItem; size: 'sm' | 'md' }) {
  if (order.disputeOuverte !== true) return null;
  return (
    <DisputeCloseDialog orderId={order.id} orderNumber={order.orderNumber}>
      <Button
        size="sm"
        variant="outline"
        aria-label={`Clore le litige de la commande ${order.orderNumber}`}
        className={cn('gap-1.5 text-[12px]', size === 'sm' ? 'h-7' : 'h-8 shrink-0')}
      >
        <Gavel className="h-3.5 w-3.5" />
        Clore le litige
      </Button>
    </DisputeCloseDialog>
  );
}

/** Bouton « changer le statut » : absent si la commande est terminée (aucune transition possible). */
function StatusAction({ order, size }: { order: OrderListItem; size: 'sm' | 'md' }) {
  if (nextOrderStatuses(order.status).length === 0) return null;
  return (
    <OrderStatusDialog
      orderId={order.id}
      orderNumber={order.orderNumber}
      currentStatus={order.status}
      disputeOuverte={order.disputeOuverte === true}
    >
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Modifier le statut de la commande ${order.orderNumber}`}
        title="Modifier le statut"
        className={cn(
          'p-0 text-muted-foreground hover:text-foreground',
          size === 'sm' ? 'h-7 w-7' : 'h-8 w-8 shrink-0',
        )}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </OrderStatusDialog>
  );
}

export function OrdersClient({ data, currentPage, activeStatus, disputeOnly }: OrdersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const setStatus = (s: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('status', s);
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  };

  const toggleDispute = () => {
    const url = new URL(window.location.href);
    if (disputeOnly) url.searchParams.delete('litige');
    else url.searchParams.set('litige', '1');
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
      (o) =>
        (o.orderNumber ?? '').toLowerCase().includes(q) ||
        (o.vendor?.shopName ?? '').toLowerCase().includes(q),
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
        <Button
          size="sm"
          variant={disputeOnly ? 'default' : 'outline'}
          className="h-8 gap-1.5 text-[12px]"
          aria-pressed={disputeOnly}
          onClick={toggleDispute}
        >
          <TriangleAlert className="h-3.5 w-3.5" />
          Litige ouvert
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="N° commande, boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
          {search.trim() && data.pages > 1 && (
            <p className="text-[11px] text-muted-foreground">
              La recherche porte uniquement sur les commandes de cette page.
            </p>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {data.data.length === 0 && data.total > 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">Page hors limites</p>
              <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => goToPage(1)}>
                Revenir à la page 1
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune commande trouvée</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">N° commande</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Boutique</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Montant</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-mono text-[12px] font-medium text-foreground">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{order.vendor?.shopName ?? '—'}</td>
                        <td className="px-4 py-3.5 font-medium whitespace-nowrap">{formatFCFA(order.total)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <LocalDate iso={order.createdAt} pattern="d MMM yyyy" />
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.status} />
                          <DisputeBadge order={order} />
                          {order.motifAnnulation && (
                            <p
                              className="mt-1 max-w-[220px] truncate text-[11px] text-muted-foreground"
                              title={order.motifAnnulation}
                            >
                              {order.motifAnnulation}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <DisputeAction order={order} size="sm" />
                            <StatusAction order={order} size="sm" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y divide-border">
                {filtered.map((order) => (
                  <div key={order.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-mono font-medium">{order.orderNumber}</p>
                      <p className="text-[11px] text-muted-foreground">{order.vendor?.shopName ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-[11px] text-muted-foreground">{formatFCFA(order.total)}</span>
                      </div>
                      <DisputeBadge order={order} />
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <DisputeAction order={order} size="md" />
                      <StatusAction order={order} size="md" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {data.total > 0 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {data.total} commande{data.total > 1 ? 's' : ''} · Page {currentPage} sur {Math.max(1, data.pages)}
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
