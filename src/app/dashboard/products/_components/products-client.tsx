'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Ban, CheckCircle2, Package, BookOpen } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFCFA } from '@/lib/format';
import { ProductBlockDialog } from './product-block-dialog';
import { ProductDetailButton } from './product-detail-dialog';
import type { AdminProductListItem, AdminProductsPage } from '@/lib/products/types';

interface Filters {
  q: string;
  status: string;
  type: string;
  blocked: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
  { value: 'brouillon', label: 'Brouillons' },
  { value: 'out_of_stock', label: 'En rupture' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'physical', label: 'Produits physiques' },
  { value: 'book', label: 'Livres numériques' },
];

const selectClass =
  'h-9 rounded-md border border-input bg-background px-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring';

function StatusBadge({ p }: { p: AdminProductListItem }) {
  if (p.isBlockedByAdmin) {
    return (
      <Badge variant="outline" className="text-[11px] border-destructive/40 text-destructive bg-destructive/5">
        Désactivé (admin)
      </Badge>
    );
  }
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Actif', cls: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' },
    inactive: { label: 'Inactif', cls: 'border-slate-500/40 text-slate-500 bg-slate-500/5' },
    brouillon: { label: 'Brouillon', cls: 'border-amber-500/40 text-amber-600 bg-amber-500/5' },
    out_of_stock: { label: 'Rupture', cls: 'border-orange-500/40 text-orange-600 bg-orange-500/5' },
  };
  const m = map[p.status] ?? { label: p.status, cls: '' };
  return (
    <Badge variant="outline" className={`text-[11px] ${m.cls}`}>
      {m.label}
    </Badge>
  );
}

function Thumb({ p }: { p: AdminProductListItem }) {
  const url = p.images?.[0]?.url;
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" loading="lazy" className="h-10 w-10 rounded-md border border-border object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
      {p.isDigital ? <BookOpen className="h-4 w-4" /> : <Package className="h-4 w-4" />}
    </div>
  );
}

function Actions({ p }: { p: AdminProductListItem }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ProductDetailButton productId={p.id} name={p.prod_name} />
      <ProductBlockDialog productId={p.id} productName={p.prod_name} blocked={p.isBlockedByAdmin}>
        {p.isBlockedByAdmin ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600"
            title="Réactiver"
            aria-label={`Réactiver ${p.prod_name}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title="Désactiver"
            aria-label={`Désactiver ${p.prod_name}`}
          >
            <Ban className="h-3.5 w-3.5" />
          </Button>
        )}
      </ProductBlockDialog>
    </div>
  );
}

export function ProductsClient({ data, filters }: { data: AdminProductsPage; filters: Filters }) {
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
              placeholder="Produit ou boutique…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-9 text-[13px]"
              aria-label="Rechercher un produit ou une boutique"
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
            value={filters.type}
            onChange={(e) => push({ type: e.target.value })}
            aria-label="Filtrer par type"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={filters.blocked === 'true'}
              onChange={(e) => push({ blocked: e.target.checked ? 'true' : '' })}
            />
            Désactivés par l&apos;admin
          </label>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-sm">Aucun produit trouvé</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Produit</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Boutique</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Prix</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden md:table-cell">Ventes</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Thumb p={p} />
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[260px]">{p.prod_name}</p>
                            {p.isDigital && (
                              <p className="text-[11px] text-muted-foreground">
                                Livre numérique{p.author ? ` · ${p.author}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.vendor?.shopName ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatFCFA(p.basePrice)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.totalVentes}</td>
                      <td className="px-4 py-3">
                        <StatusBadge p={p} />
                      </td>
                      <td className="px-4 py-3">
                        <Actions p={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-border">
              {data.data.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Thumb p={p} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{p.prod_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.vendor?.shopName ?? '—'} · {formatFCFA(p.basePrice)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge p={p} />
                    </div>
                  </div>
                  <Actions p={p} />
                </div>
              ))}
            </div>
          </>
        )}

        {(data.pages > 1 || data.page > 1) && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
            <p className="text-[12px] text-muted-foreground">
              {data.total} produit{data.total > 1 ? 's' : ''} · Page {data.page} sur {data.pages}
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
  );
}
