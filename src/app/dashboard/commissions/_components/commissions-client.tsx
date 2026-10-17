'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { markCommissionPaidAction } from '@/server/actions/commissions-actions';
import { formatFCFA, formatFCFACompact, formatNumber, toNumber } from '@/lib/format';
import {
  COMMISSION_STATUS,
  COMMISSION_STATUS_LIST,
  commissionStatusMeta,
} from '@/lib/status-meta';
import type { CommissionListItem, CommissionStats, BackendPaginated } from '@/lib/commissions/types';

interface CommissionsClientProps {
  data: BackendPaginated<CommissionListItem>;
  /** null = les statistiques n'ont pas pu être chargées (la liste reste utilisable). */
  stats: CommissionStats | null;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  ...COMMISSION_STATUS_LIST.map((value) => ({ value, label: commissionStatusMeta(value).filterLabel })),
];

function StatusBadge({ status }: { status: string }) {
  const meta = commissionStatusMeta(status);
  return (
    <Badge variant="outline" className={cn('text-[11px]', meta.badge)}>
      {meta.label}
    </Badge>
  );
}

/** « Marquer payée » demande une confirmation : le serveur refuse de revenir en arrière. */
function MarkPaidButton({ commission }: { commission: CommissionListItem }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const r = await markCommissionPaidAction(commission.id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success('Commission marquée comme payée');
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button
          size="sm" variant="outline"
          className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Marquer payée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Marquer comme payée ?
          </DialogTitle>
          <DialogDescription>
            Commande <span className="font-mono font-medium">{commission.order?.orderNumber ?? '—'}</span>
            {commission.vendor?.shopName ? <> · {commission.vendor.shopName}</> : null}
          </DialogDescription>
        </DialogHeader>
        <p className="text-[13px] text-muted-foreground">
          Confirmez-vous le paiement de la commission de{' '}
          <span className="font-medium text-foreground">{formatFCFA(commission.montantCommission)}</span> ?
          Cette action est définitive : elle ne peut pas être annulée depuis cette page.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Marquer payée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        (c.order?.orderNumber ?? '').toLowerCase().includes(q) ||
        (c.vendor?.shopName ?? '').toLowerCase().includes(q),
    );
  }, [data.data, search]);

  return (
    <div className="space-y-4">
      {/* Cartes de statistiques (forme serveur : { pending, paid, total } → { count, amount }) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Total commissions</p>
            <p className="text-xl font-bold">{stats ? formatFCFACompact(stats.total.amount) : '—'}</p>
            <p className="text-[11px] text-muted-foreground">
              {stats ? `${formatNumber(stats.total.count)} opération${stats.total.count > 1 ? 's' : ''}` : 'Statistiques indisponibles'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">En attente</p>
            <p className="text-xl font-bold text-amber-600">{stats ? formatFCFACompact(stats.pending.amount) : '—'}</p>
            <p className="text-[11px] text-muted-foreground">
              {stats ? `${formatNumber(stats.pending.count)} en attente` : ' '}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Payées</p>
            <p className="text-xl font-bold text-emerald-600">{stats ? formatFCFACompact(stats.paid.amount) : '—'}</p>
            <p className="text-[11px] text-muted-foreground">
              {stats ? `${formatNumber(stats.paid.count)} payée${stats.paid.count > 1 ? 's' : ''}` : ' '}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button key={f.value} size="sm" variant={activeStatus === f.value ? 'default' : 'outline'} className="h-8 text-[12px]" aria-pressed={activeStatus === f.value} onClick={() => setStatus(f.value)}>
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
          {search.trim() && data.pages > 1 && (
            <p className="text-[11px] text-muted-foreground">La recherche porte uniquement sur les commissions de cette page.</p>
          )}
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
                        <td className="px-6 py-3.5 font-mono text-[12px] font-medium">{c.order?.orderNumber ?? '—'}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{c.vendor?.shopName ?? '—'}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatFCFA(c.totalCommande)}</td>
                        <td className="px-4 py-3.5 font-semibold text-primary whitespace-nowrap">{formatFCFA(c.montantCommission)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{toNumber(c.taux)}%</td>
                        <td className="px-4 py-3.5 text-muted-foreground"><LocalDate iso={c.createdAt} pattern="d MMM yyyy" /></td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={c.status} />
                          {c.status === COMMISSION_STATUS.PAID && c.paidAt && (
                            <p className="text-[11px] text-muted-foreground">
                              le <LocalDate iso={c.paidAt} pattern="d MMM yyyy" />
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {c.status === COMMISSION_STATUS.PENDING && <MarkPaidButton commission={c} />}
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
                      <span className="font-mono text-[12px] font-medium">{c.order?.orderNumber ?? '—'}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[12px] text-muted-foreground">{c.vendor?.shopName ?? '—'}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[13px] font-semibold text-primary">{formatFCFA(c.montantCommission)}</span>
                        <span className="text-[11px] text-muted-foreground ml-1">({toNumber(c.taux)}%)</span>
                      </div>
                      {c.status === COMMISSION_STATUS.PENDING && <MarkPaidButton commission={c} />}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.total > 0 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">{data.total} commission{data.total > 1 ? 's' : ''} · Page {currentPage} sur {Math.max(1, data.pages)}</p>
              {data.pages > 1 && (
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Page précédente" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Page suivante" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= data.pages}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
