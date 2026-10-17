'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, PowerOff, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LocalDate } from '@/components/local-date';
import { CreateCouponDialog } from './create-coupon-dialog';
import { deactivateCouponAction } from '@/server/actions/coupons-actions';
import type { CouponListItem, BackendPaginated } from '@/lib/coupons/types';

interface CouponsClientProps {
  data: BackendPaginated<CouponListItem>;
  currentPage: number;
  activeFilter: string;
}

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

function formatValue(coupon: CouponListItem) {
  // Le serveur renvoie les montants décimaux sous forme de texte ("20.00") : on convertit.
  const n = Number(coupon.value);
  const value = Number.isFinite(n) ? n : 0;
  if (coupon.type === 'pourcentage') return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} F`;
}

function DeactivateButton({ id, code }: { id: string; code: string }) {
  const handleConfirm = async () => {
    try {
      const result = await deactivateCouponAction(id);
      if (result.success) toast.success('Coupon désactivé');
      else toast.error(result.error);
    } catch {
      toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
    }
  };
  return (
    <ConfirmDialog
      trigger={
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          title="Désactiver"
          aria-label={`Désactiver le coupon ${code}`}
        >
          <PowerOff className="h-3.5 w-3.5" />
        </Button>
      }
      title="Désactiver ce coupon ?"
      description={`Le code « ${code} » ne pourra plus être utilisé par les clients. Cette action ne peut pas être annulée depuis cette page.`}
      confirmLabel="Désactiver"
      tone="destructive"
      onConfirm={handleConfirm}
    />
  );
}

export function CouponsClient({ data, currentPage, activeFilter }: CouponsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const setFilter = (f: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('filter', f);
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  };

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(Math.max(1, p)));
    router.push(url.pathname + url.search);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter((c) => c.code.toLowerCase().includes(q));
  }, [data.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={activeFilter === f.value ? 'default' : 'outline'}
              className="h-8 text-[12px]"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <CreateCouponDialog />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Chercher un code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Tag className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun coupon trouvé</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Code</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Type</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Valeur</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Utilisations</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden md:table-cell">Expire le</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-mono text-[12px] font-semibold tracking-wider">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {coupon.type === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'}
                        </td>
                        <td className="px-4 py-3.5 font-semibold">{formatValue(coupon)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {coupon.usedCount}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                          <LocalDate iso={coupon.expiresAt} pattern="d MMM yyyy" />
                        </td>
                        <td className="px-4 py-3.5">
                          {coupon.isActive ? (
                            <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] border-slate-500/40 text-slate-500 bg-slate-500/5">
                              Inactif
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {coupon.isActive && <DeactivateButton id={coupon.id} code={coupon.code} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-border">
                {filtered.map((coupon) => (
                  <div key={coupon.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-mono font-semibold">{coupon.code}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {coupon.type === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'} · {formatValue(coupon)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {coupon.isActive ? (
                          <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-600 bg-emerald-500/5">Actif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] border-slate-500/40 text-slate-500 bg-slate-500/5">Inactif</Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''} utilisations
                        </span>
                      </div>
                    </div>
                    {coupon.isActive && <DeactivateButton id={coupon.id} code={coupon.code} />}
                  </div>
                ))}
              </div>
            </>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {data.total} coupon{data.total > 1 ? 's' : ''} · Page {currentPage} sur {data.pages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= data.pages}>
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
