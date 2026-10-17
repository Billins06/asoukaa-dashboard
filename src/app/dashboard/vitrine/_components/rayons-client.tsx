'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  GalleryHorizontalEnd,
  Loader2,
  Package,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
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
import { ImagePreview } from '@/components/image-upload-field';
import {
  deleteRayonAction,
  reorderRayonsAction,
  updateRayonAction,
} from '@/server/actions/vitrine-actions';
import type { Rayon } from '@/lib/vitrine/types';
import { RayonFormDialog } from './rayon-form-dialog';
import { RayonProductsDialog } from './rayon-products-dialog';
import { ToggleSwitch } from './toggle-switch';
import { formatPeriod, periodStatus, rayonTypeMeta } from './vitrine-utils';
import { useHydrated } from './use-hydrated';

// ─── Petits composants ─────────────────────────────────────

function TypeBadge({ rayon }: { rayon: Rayon }) {
  const meta = rayonTypeMeta(rayon.type);
  return (
    <Badge variant="outline" className={`text-[11px] ${meta.className}`}>
      {meta.label}
    </Badge>
  );
}

function PeriodCell({ rayon }: { rayon: Rayon }) {
  const hydrated = useHydrated();
  if (!hydrated) return <span className="text-muted-foreground">…</span>;
  const status = periodStatus(rayon.startsAt, rayon.endsAt);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">{formatPeriod(rayon.startsAt, rayon.endsAt)}</span>
      {status === 'programme' && (
        <Badge variant="outline" className="text-[10px] border-sky-500/40 text-sky-600 bg-sky-500/5">
          Programmé
        </Badge>
      )}
      {status === 'termine' && (
        <Badge variant="outline" className="text-[10px] border-slate-400/40 text-slate-500 bg-slate-500/5">
          Terminé
        </Badge>
      )}
    </span>
  );
}

/** « 12 · 9 visibles » — signale les produits placés mais invisibles dans l'appli. */
function ProductCountCell({ rayon }: { rayon: Rayon }) {
  const total = rayon.productCount ?? 0;
  const visible = rayon.visibleProductCount ?? 0;
  const hidden = total - visible;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="font-medium">{total}</span>
      <span className="text-muted-foreground">
        · {visible} visible{visible > 1 ? 's' : ''}
      </span>
      {hidden > 0 && (
        <span
          className="text-[11px] text-amber-600"
          title="Produits du rayon non visibles dans l'application (brouillon, désactivé ou en rupture)"
        >
          ({hidden} masqué{hidden > 1 ? 's' : ''})
        </span>
      )}
    </span>
  );
}

function ActiveSwitch({ rayon }: { rayon: Rayon }) {
  const [isPending, startTransition] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <ToggleSwitch
        checked={rayon.isActive}
        disabled={isPending}
        label={rayon.isActive ? `Désactiver « ${rayon.nom} »` : `Activer « ${rayon.nom} »`}
        onCheckedChange={(v) =>
          startTransition(async () => {
            const r = await updateRayonAction(rayon.id, { isActive: v });
            if (!r.success) toast.error(r.error);
            else toast.success(v ? 'Rayon activé' : 'Rayon désactivé');
          })
        }
      />
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </span>
  );
}

function DeleteRayonButton({ rayon }: { rayon: Rayon }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      const r = await deleteRayonAction(rayon.id);
      if (r.success) {
        toast.success('Rayon supprimé');
        setOpen(false);
      } else {
        toast.error(r.error);
      }
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le rayon ?</DialogTitle>
          <DialogDescription>
            Le rayon « {rayon.nom} » sera supprimé définitivement
            {rayon.productCount > 0
              ? ` (ses ${rayon.productCount} produit${rayon.productCount > 1 ? 's' : ''} restent en ligne, ils sont seulement retirés du rayon).`
              : '.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ rayon }: { rayon: Rayon }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <RayonProductsDialog rayon={rayon}>
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[12px]" title="Gérer les produits">
          <Package className="h-3.5 w-3.5" />
          Produits
        </Button>
      </RayonProductsDialog>
      <RayonFormDialog mode="edit" rayon={rayon}>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </RayonFormDialog>
      <DeleteRayonButton rayon={rayon} />
    </div>
  );
}

// ─── Liste ─────────────────────────────────────────────────

export function RayonsClient({ rayons }: { rayons: Rayon[] }) {
  const [isMoving, startMoving] = useTransition();

  const sorted = useMemo(
    () =>
      [...rayons].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      ),
    [rayons],
  );

  const total = sorted.length;
  const active = sorted.filter((r) => r.isActive).length;
  const nextSortOrder = total > 0 ? Math.max(...sorted.map((r) => r.sortOrder)) + 1 : 0;

  /**
   * Déplace un rayon d'un cran puis renumérote toute la liste 0..n-1
   * (robuste même si plusieurs rayons ont le même sortOrder) ; seuls les
   * rayons dont l'ordre change reçoivent un PATCH.
   */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    const changes = next
      .map((r, i) => ({ id: r.id, sortOrder: i, before: r.sortOrder }))
      .filter((c) => c.sortOrder !== c.before)
      .map(({ id, sortOrder }) => ({ id, sortOrder }));
    if (changes.length === 0) return;
    startMoving(async () => {
      const r = await reorderRayonsAction(changes);
      if (!r.success) toast.error(`Réorganisation incomplète : ${r.error}`);
    });
  };

  const renderMoveButtons = (index: number) => (
    <div className="flex items-center gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground"
        title="Monter"
        disabled={index === 0 || isMoving}
        onClick={() => move(index, -1)}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground"
        title="Descendre"
        disabled={index === sorted.length - 1 || isMoving}
        onClick={() => move(index, 1)}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          {total} rayon{total > 1 ? 's' : ''} · {active} actif{active > 1 ? 's' : ''}
          {isMoving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </p>
        <RayonFormDialog mode="create" defaultSortOrder={nextSortOrder} />
      </div>

      <Card>
        <CardContent className="p-0">
          {total === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <GalleryHorizontalEnd className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun rayon pour le moment</p>
              <RayonFormDialog mode="create" defaultSortOrder={0} />
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Ordre</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Rayon</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Type</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Produits</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Période</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Actif</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((rayon, i) => (
                      <tr key={rayon.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="w-5 text-right text-[12px] text-muted-foreground">{i + 1}</span>
                            {renderMoveButtons(i)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ImagePreview
                              src={rayon.imageUrl}
                              alt={rayon.nom}
                              className="h-10 w-10 shrink-0 rounded-full border border-border"
                            />
                            <span className={`font-medium ${rayon.isActive ? '' : 'text-muted-foreground'}`}>
                              {rayon.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><TypeBadge rayon={rayon} /></td>
                        <td className="px-4 py-3"><ProductCountCell rayon={rayon} /></td>
                        <td className="px-4 py-3 text-[12px]"><PeriodCell rayon={rayon} /></td>
                        <td className="px-4 py-3"><ActiveSwitch rayon={rayon} /></td>
                        <td className="px-4 py-3"><RowActions rayon={rayon} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border">
                {sorted.map((rayon, i) => (
                  <div key={rayon.id} className="space-y-2 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <ImagePreview
                        src={rayon.imageUrl}
                        alt={rayon.nom}
                        className="h-10 w-10 shrink-0 rounded-full border border-border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-medium ${rayon.isActive ? '' : 'text-muted-foreground'}`}>
                          {i + 1}. {rayon.nom}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <TypeBadge rayon={rayon} />
                          <span className="text-[11px] text-muted-foreground">
                            {rayon.productCount} produit{rayon.productCount > 1 ? 's' : ''} · {rayon.visibleProductCount ?? 0} visible{(rayon.visibleProductCount ?? 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <ActiveSwitch rayon={rayon} />
                    </div>
                    <div className="text-[11px]"><PeriodCell rayon={rayon} /></div>
                    <div className="flex items-center justify-between">
                      {renderMoveButtons(i)}
                      <RowActions rayon={rayon} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
