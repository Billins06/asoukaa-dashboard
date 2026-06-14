'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  ShoppingCart,
  TrendingUp,
  XCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { OrderStatusValue } from '@/lib/dashboard/types';

/* ─── Types ─────────────────────────────────────────────── */

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: number;
  total: number;
  status: OrderStatusValue;
  createdAt: Date;
  vendorName: string;
}

type SortField = 'createdAt' | 'total' | 'id';
type SortDir = 'asc' | 'desc';

/* ─── Mock data (remplacer par fetch backend) ─────────────── */

const MOCK: Order[] = [
  { id: 'CMD-2847', customerName: 'Kofi Mensah', customerPhone: '+225 07 12 34 56', items: 3, total: 47500, status: 'delivered', createdAt: new Date('2025-06-10T09:23:00'), vendorName: 'TechShop Abidjan' },
  { id: 'CMD-2846', customerName: 'Aïssatou Diallo', customerPhone: '+225 05 98 76 54', items: 1, total: 12800, status: 'pending', createdAt: new Date('2025-06-12T14:05:00'), vendorName: 'Mode Africaine' },
  { id: 'CMD-2845', customerName: 'Moussa Touré', customerPhone: '+225 01 55 43 21', items: 5, total: 89000, status: 'preparing', createdAt: new Date('2025-06-12T11:30:00'), vendorName: 'Électronique Plus' },
  { id: 'CMD-2844', customerName: 'Fatou Camara', customerPhone: '+225 07 77 88 99', items: 2, total: 23400, status: 'shipped', createdAt: new Date('2025-06-11T16:45:00'), vendorName: 'Beauté Naturelle' },
  { id: 'CMD-2843', customerName: 'Yao Koffi', customerPhone: '+225 05 33 44 55', items: 1, total: 8750, status: 'delivered', createdAt: new Date('2025-06-09T08:12:00'), vendorName: 'Marché Bio' },
  { id: 'CMD-2842', customerName: 'Mariame Coulibaly', customerPhone: '+225 01 22 33 44', items: 4, total: 62000, status: 'cancelled', createdAt: new Date('2025-06-08T17:20:00'), vendorName: 'TechShop Abidjan' },
  { id: 'CMD-2841', customerName: 'Samba Ndiaye', customerPhone: '+225 07 66 55 44', items: 2, total: 18500, status: 'pending', createdAt: new Date('2025-06-12T09:00:00'), vendorName: 'Mode Africaine' },
  { id: 'CMD-2840', customerName: 'Aminata Bah', customerPhone: '+225 05 11 22 33', items: 6, total: 135000, status: 'preparing', createdAt: new Date('2025-06-12T07:55:00'), vendorName: 'Électronique Plus' },
  { id: 'CMD-2839', customerName: 'Kwame Asante', customerPhone: '+225 01 88 77 66', items: 1, total: 5200, status: 'delivered', createdAt: new Date('2025-06-07T12:30:00'), vendorName: 'Marché Bio' },
  { id: 'CMD-2838', customerName: 'Djeneba Konaté', customerPhone: '+225 07 44 33 22', items: 3, total: 34700, status: 'shipped', createdAt: new Date('2025-06-10T15:10:00'), vendorName: 'Beauté Naturelle' },
  { id: 'CMD-2837', customerName: 'Ibrahima Sow', customerPhone: '+225 05 99 88 77', items: 2, total: 27300, status: 'delivered', createdAt: new Date('2025-06-06T10:40:00'), vendorName: 'Mode Africaine' },
  { id: 'CMD-2836', customerName: 'Naomie Kouassi', customerPhone: '+225 01 66 77 88', items: 1, total: 9500, status: 'pending', createdAt: new Date('2025-06-12T13:25:00'), vendorName: 'Marché Bio' },
  { id: 'CMD-2835', customerName: 'Ousmane Traoré', customerPhone: '+225 07 22 11 00', items: 7, total: 198000, status: 'preparing', createdAt: new Date('2025-06-11T08:00:00'), vendorName: 'TechShop Abidjan' },
  { id: 'CMD-2834', customerName: 'Bintou Keita', customerPhone: '+225 05 55 66 77', items: 2, total: 15600, status: 'delivered', createdAt: new Date('2025-06-05T14:50:00'), vendorName: 'Beauté Naturelle' },
  { id: 'CMD-2833', customerName: 'Lassina Ouédraogo', customerPhone: '+225 01 33 44 55', items: 4, total: 52000, status: 'cancelled', createdAt: new Date('2025-06-04T09:30:00'), vendorName: 'Électronique Plus' },
  { id: 'CMD-2832', customerName: 'Chantal Akosua', customerPhone: '+225 07 88 99 00', items: 1, total: 7800, status: 'shipped', createdAt: new Date('2025-06-09T17:15:00'), vendorName: 'Mode Africaine' },
  { id: 'CMD-2831', customerName: 'Sékou Diabaté', customerPhone: '+225 05 44 55 66', items: 3, total: 41200, status: 'delivered', createdAt: new Date('2025-06-03T11:00:00'), vendorName: 'TechShop Abidjan' },
  { id: 'CMD-2830', customerName: 'Viviane N\'Guessan', customerPhone: '+225 01 77 88 99', items: 2, total: 22100, status: 'pending', createdAt: new Date('2025-06-12T16:40:00'), vendorName: 'Marché Bio' },
  { id: 'CMD-2829', customerName: 'Tidiane Baldé', customerPhone: '+225 07 11 22 33', items: 5, total: 83500, status: 'delivering', createdAt: new Date('2025-06-08T13:20:00'), vendorName: 'Électronique Plus' },
  { id: 'CMD-2828', customerName: 'Mariam Sanogo', customerPhone: '+225 05 66 77 88', items: 1, total: 4300, status: 'delivered', createdAt: new Date('2025-06-02T10:10:00'), vendorName: 'Beauté Naturelle' },
].map((o) => ({ ...o, status: o.status === ('delivering' as string) ? 'shipped' : o.status })) as Order[];

/* ─── Status config ──────────────────────────────────────── */

const STATUS_CFG: Record<
  OrderStatusValue,
  { label: string; bg: string; text: string; dot: string; pulse: boolean; icon: React.ElementType }
> = {
  pending:   { label: 'En attente',      bg: 'bg-amber-100 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   pulse: true,  icon: Clock    },
  preparing: { label: 'En préparation',  bg: 'bg-blue-100 dark:bg-blue-950/40',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500',    pulse: true,  icon: Package  },
  shipped:   { label: 'Expédiée',        bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500',  pulse: false, icon: Truck    },
  delivered: { label: 'Livrée',          bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', pulse: false, icon: Check   },
  cancelled: { label: 'Annulée',         bg: 'bg-red-100 dark:bg-red-950/40',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',     pulse: false, icon: XCircle  },
};

/* ─── Helpers ────────────────────────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}

function fmtDate(d: Date) {
  if (isToday(d)) return `Aujourd'hui, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Hier, ${format(d, 'HH:mm')}`;
  return format(d, 'd MMM yyyy', { locale: fr });
}

const PAGE_SIZE = 10;

const STATUS_ALL = 'all' as const;

/* ─── Sub-components ─────────────────────────────────────── */

function StatusBadge({ status }: { status: OrderStatusValue }) {
  const cfg = STATUS_CFG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        cfg.bg,
        cfg.text,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {cfg.pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', cfg.dot)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', cfg.dot)} />
      </span>
      {cfg.label}
    </span>
  );
}

function SortIcon({ field, sort }: { field: SortField; sort: { field: SortField; dir: SortDir } }) {
  if (sort.field !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 ml-1 shrink-0" />;
  return sort.dir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />
    : <ArrowDown className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />;
}

/* ─── Stats cards ────────────────────────────────────────── */

function OrderStats({ orders }: { orders: Order[] }) {
  const total = orders.length;
  const byStatus = (s: OrderStatusValue) => orders.filter((o) => o.status === s).length;
  const revenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  const cards = [
    { label: 'Total commandes', value: total, icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'En attente', value: byStatus('pending'), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
    { label: 'En préparation', value: byStatus('preparing'), icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Expédiées', value: byStatus('shipped'), icon: Truck, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-950/40' },
    { label: 'Livrées', value: byStatus('delivered'), icon: Check, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'CA livré', value: fmt(revenue), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', wide: true },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.label}
            className={cn('transition-all duration-200 hover:shadow-md hover:-translate-y-px')}
          >
            <CardContent className="p-4">
              <div className={cn('inline-flex p-1.5 rounded-lg mb-3', c.bg)}>
                <Icon className={cn('h-3.5 w-3.5', c.color)} />
              </div>
              <p className="text-xl font-bold tracking-tight leading-none">{c.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-none">{c.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export function OrdersClient() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusValue | typeof STATUS_ALL>(STATUS_ALL);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' },
    );
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = MOCK;
    if (statusFilter !== STATUS_ALL) result = result.filter((o) => o.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.vendorName.toLowerCase().includes(q),
      );
    }
    return result.slice().sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.field === 'createdAt') return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      if (sort.field === 'total') return (a.total - b.total) * dir;
      return a.id.localeCompare(b.id) * dir;
    });
  }, [query, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {filtered.length !== MOCK.length && ` sur ${MOCK.length}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <OrderStats orders={MOCK} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher par ID, client, boutique…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="pl-8 h-9 text-[13px] bg-card"
          />
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9 text-[13px] bg-card">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              {statusFilter === STATUS_ALL
                ? 'Tous les statuts'
                : STATUS_CFG[statusFilter].label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {([STATUS_ALL, 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                onSelect={() => { setStatusFilter(s); setPage(1); }}
                className={cn('flex items-center gap-2 text-[13px]', s === statusFilter && 'text-primary font-medium')}
              >
                <Check className={cn('h-3.5 w-3.5', s === statusFilter ? 'opacity-100 text-primary' : 'opacity-0')} />
                {s === STATUS_ALL ? 'Tous' : STATUS_CFG[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table — desktop */}
      <Card className="hidden sm:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {(
                  [
                    { label: 'Référence', field: 'id' as SortField },
                    { label: 'Client', field: null },
                    { label: 'Boutique', field: null },
                    { label: 'Articles', field: null },
                    { label: 'Montant', field: 'total' as SortField },
                    { label: 'Date', field: 'createdAt' as SortField },
                    { label: 'Statut', field: null },
                  ] as const
                ).map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={field ? () => toggleSort(field) : undefined}
                    className={cn(
                      'px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap select-none',
                      field && 'cursor-pointer hover:text-foreground transition-colors',
                    )}
                  >
                    <span className="inline-flex items-center">
                      {label}
                      {field && <SortIcon field={field} sort={sort} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                slice.map((order, i) => (
                  <tr
                    key={order.id}
                    className="group border-b border-border/50 hover:bg-accent/40 transition-all duration-150 cursor-pointer"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Left border indicator on hover */}
                    <td className="px-4 py-3 relative">
                      <span className="absolute left-0 inset-y-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-150 rounded-r-full" />
                      <span className="font-mono font-semibold text-foreground">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{order.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.vendorName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-foreground text-[11px] font-bold">
                        {order.items}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground">
                      {fmt(order.total)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {fmtDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card list — mobile */}
      <div className="sm:hidden space-y-2">
        {slice.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Aucune commande trouvée</p>
        ) : (
          slice.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden transition-all duration-200 active:scale-[0.99]"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-[13px]">{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-semibold text-[15px] leading-tight">{order.customerName}</p>
                <p className="text-[12px] text-muted-foreground mb-2">{order.vendorName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {order.items} article{order.items > 1 ? 's' : ''} · {fmtDate(order.createdAt)}
                  </span>
                  <span className="font-bold text-[14px] text-primary">{fmt(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-[12px] text-muted-foreground hidden sm:block">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur{' '}
            {filtered.length} commandes
          </p>

          <div className="flex items-center gap-1 mx-auto sm:mx-0">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {pageNumbers.reduce<(number | 'ellipsis')[]>((acc, n, i, arr) => {
              if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('ellipsis');
              acc.push(n);
              return acc;
            }, []).map((item, i) =>
              item === 'ellipsis' ? (
                <span key={`e-${i}`} className="px-1 text-muted-foreground text-[13px]">…</span>
              ) : (
                <Button
                  key={item}
                  variant={item === safePage ? 'default' : 'outline'}
                  size="icon"
                  className={cn(
                    'h-8 w-8 text-[13px] transition-all',
                    item === safePage && 'shadow-md shadow-primary/20',
                  )}
                  onClick={() => setPage(item as number)}
                >
                  {item}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
