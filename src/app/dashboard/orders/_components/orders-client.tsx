'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderStatusDialog } from './order-status-dialog';
import { formatXOFCompact } from '../../_lib/format';
import type { OrderListItem, OrderStatus, BackendPaginated } from '@/lib/orders/types';

interface OrdersClientProps {
  data: BackendPaginated<OrderListItem>;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PREPARING', label: 'En préparation' },
  { value: 'SHIPPED', label: 'Expédiées' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
  PREPARING: 'border-blue-500/40 text-blue-600 bg-blue-500/5',
  SHIPPED: 'border-indigo-500/40 text-indigo-600 bg-indigo-500/5',
  DELIVERED: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
  CANCELLED: 'border-slate-500/40 text-slate-500 bg-slate-500/5',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédié',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`text-[11px] ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function OrdersClient({ data, currentPage, activeStatus }: OrdersClientProps) {
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
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.vendor.shopName.toLowerCase().includes(q),
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
              placeholder="N° commande, boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
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
                        <td className="px-4 py-3.5 text-muted-foreground">{order.vendor.shopName}</td>
                        <td className="px-4 py-3.5 font-medium">{formatXOFCompact(order.total)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {format(new Date(order.createdAt), 'd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <OrderStatusDialog
                            orderId={order.id}
                            orderNumber={order.orderNumber}
                            currentStatus={order.status}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </OrderStatusDialog>
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
                      <p className="text-[11px] text-muted-foreground">{order.vendor.shopName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-[11px] text-muted-foreground">{formatXOFCompact(order.total)}</span>
                      </div>
                    </div>
                    <OrderStatusDialog
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      currentStatus={order.status}
                    >
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </OrderStatusDialog>
                  </div>
                ))}
              </div>
            </>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {data.total} commande{data.total > 1 ? 's' : ''} · Page {currentPage} sur {data.pages}
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
