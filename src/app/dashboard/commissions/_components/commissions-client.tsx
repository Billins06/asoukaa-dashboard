'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { markCommissionPaidAction } from '@/server/actions/commissions-actions';
import { formatXOFCompact } from '../../_lib/format';
import type { CommissionListItem, CommissionStats, CommissionStatus, BackendPaginated } from '@/lib/commissions/types';

interface CommissionsClientProps {
  data: BackendPaginated<CommissionListItem>;
  stats: CommissionStats;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PAID', label: 'Payées' },
];

function StatusBadge({ status }: { status: CommissionStatus }) {
  return status === 'PAID' ? (
    <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-600 bg-emerald-500/5">Payée</Badge>
  ) : (
    <Badge variant="outline" className="text-[11px] border-amber-500/40 text-amber-600 bg-amber-500/5">En attente</Badge>
  );
}

function MarkPaidButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm" variant="outline"
      className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const r = await markCommissionPaidAction(id);
        if (!r.success) toast.error(r.error);
        else toast.success('Commission marquée comme payée');
      })}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
      Marquer payée
    </Button>
  );
}

export function CommissionsClient({ data, stats, currentPage, activeStatus }: CommissionsClientProps) {
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
      (c) =>
        c.order.orderNumber.toLowerCase().includes(q) ||
        c.vendor.shopName.toLowerCase().includes(q),
    );
  }, [data.data, search]);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Total commissions</p>
            <p className="text-xl font-bold">{formatXOFCompact(stats.montantTotal ?? 0)}</p>
            <p className="text-[11px] text-muted-foreground">{stats.totalCommissions ?? 0} opérations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">En attente</p>
            <p className="text-xl font-bold text-amber-600">{formatXOFCompact(stats.montantPending ?? 0)}</p>
            <p className="text-[11px] text-muted-foreground">{stats.totalPending ?? 0} en attente</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Payées</p>
            <p className="text-xl font-bold text-emerald-600">{formatXOFCompact(stats.montantPaid ?? 0)}</p>
            <p className="text-[11px] text-muted-foreground">{stats.totalPaid ?? 0} payées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button key={f.value} size="sm" variant={activeStatus === f.value ? 'default' : 'outline'} className="h-8 text-[12px]" onClick={() => setStatus(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="N° commande, boutique..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-[13px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Aucune commission trouvée</div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Commande</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Boutique</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Montant cmd</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Commission</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Taux</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Date</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-[12px] font-medium">{c.order.orderNumber}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{c.vendor.shopName}</td>
                        <td className="px-4 py-3.5">{formatXOFCompact(c.totalCommande)}</td>
                        <td className="px-4 py-3.5 font-semibold text-primary">{formatXOFCompact(c.montantCommission)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{c.taux}%</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{format(new Date(c.createdAt), 'd MMM yyyy', { locale: fr })}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3.5 text-right">
                          {c.status === 'PENDING' && <MarkPaidButton id={c.id} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-border">
                {filtered.map((c) => (
                  <div key={c.id} className="px-4 py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-medium">{c.order.orderNumber}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[12px] text-muted-foreground">{c.vendor.shopName}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[13px] font-semibold text-primary">{formatXOFCompact(c.montantCommission)}</span>
                        <span className="text-[11px] text-muted-foreground ml-1">({c.taux}%)</span>
                      </div>
                      {c.status === 'PENDING' && <MarkPaidButton id={c.id} />}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">{data.total} commission{data.total > 1 ? 's' : ''} · Page {currentPage} sur {data.pages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= data.pages}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
