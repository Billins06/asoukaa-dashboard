'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDown, ArrowUp, Loader2, Store, Trash2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  reorderBestShopsAction,
  removeBestShopAction,
  setBestShopActiveAction,
} from '@/server/actions/vitrine-actions';
import { BEST_SHOPS_MAX, type BestShop } from '@/lib/vitrine/types';
import { ToggleSwitch } from '../../_components/toggle-switch';
import { AddBestShopDialog } from './add-best-shop-dialog';
import { notDisplayedReasons } from './best-shops-utils';

function ActiveSwitch({ shop }: { shop: BestShop }) {
  const [isPending, startTransition] = useTransition();
  const name = shop.vendor.shopName;
  return (
    <span className="inline-flex items-center gap-2">
      <ToggleSwitch
        checked={shop.isActive}
        disabled={isPending}
        label={shop.isActive ? `Masquer « ${name} »` : `Afficher « ${name} »`}
        onCheckedChange={(v) =>
          startTransition(async () => {
            const r = await setBestShopActiveAction(shop.id, v);
            if (!r.success) toast.error(r.error);
            else toast.success(v ? 'Boutique activée' : 'Boutique désactivée');
          })
        }
      />
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </span>
  );
}

function RemoveButton({ shop, onRemoved }: { shop: BestShop; onRemoved: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      const r = await removeBestShopAction(shop.id);
      if (r.success) {
        toast.success('Boutique retirée de la liste');
        onRemoved(shop.id);
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
          title="Retirer de la liste"
          aria-label={`Retirer « ${shop.vendor.shopName} » de la liste`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retirer cette boutique ?</DialogTitle>
          <DialogDescription>
            « {shop.vendor.shopName} » ne fera plus partie des Meilleures boutiques. La boutique elle-même
            n&apos;est pas supprimée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Retirer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BestShopsClient({ shops }: { shops: BestShop[] }) {
  // État local pour réagir tout de suite (ordre, ajout, retrait) ; resynchronisé
  // avec le serveur à chaque nouvelle liste reçue.
  const [items, setItems] = useState(shops);
  const [lastShops, setLastShops] = useState(shops);
  if (shops !== lastShops) {
    setLastShops(shops);
    setItems(shops);
  }
  const [isMoving, startMoving] = useTransition();

  const total = items.length;
  const displayed = items.filter((s) => s.isDisplayed).length;
  const isFull = total >= BEST_SHOPS_MAX;

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    startMoving(async () => {
      // Le serveur exige TOUS les ids dans le nouvel ordre.
      const r = await reorderBestShopsAction(next.map((s) => s.id));
      if (r.success) {
        if (r.data.length > 0) setItems(r.data);
      } else {
        setItems(previous);
        toast.error(`Réorganisation impossible : ${r.error}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {total} / {BEST_SHOPS_MAX}
          </span>
          boutique{total > 1 ? 's' : ''}
          <span>
            · {displayed} affichée{displayed > 1 ? 's' : ''} sur l&apos;accueil
          </span>
          {isMoving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </p>
        <AddBestShopDialog
          currentCount={total}
          onAdded={(row) => setItems((prev) => (prev.some((s) => s.id === row.id) ? prev : [...prev, row]))}
        />
      </div>

      {isFull && (
        <p className="text-[12px] text-amber-700 dark:text-amber-400">
          La liste est complète ({BEST_SHOPS_MAX} boutiques maximum) : retirez une boutique pour en ajouter une autre.
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {total === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Store className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune boutique dans la liste pour le moment</p>
              <p className="text-[12px]">Utilisez « Ajouter une boutique » pour composer la liste.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((shop, i) => {
                const reasons = notDisplayedReasons(shop);
                const visible = shop.visibleProductCount;
                return (
                  <li key={shop.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5">
                    <div className="flex items-center gap-0.5">
                      <span className="w-6 text-right text-[12px] text-muted-foreground">{i + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="Monter"
                        aria-label="Monter"
                        disabled={i === 0 || isMoving}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="Descendre"
                        aria-label="Descendre"
                        disabled={i === items.length - 1 || isMoving}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <ImagePreview
                      src={shop.vendor.logoUrl}
                      alt={shop.vendor.shopName}
                      className="h-10 w-10 shrink-0 rounded-full border border-border"
                    />

                    <div className="min-w-0 flex-1 basis-40">
                      <p
                        className={`truncate text-[13px] font-medium ${shop.isActive ? '' : 'text-muted-foreground'}`}
                        title={shop.vendor.shopName}
                      >
                        {shop.vendor.shopName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {visible} produit{visible > 1 ? 's' : ''} visible{visible > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      <ActiveSwitch shop={shop} />
                      <RemoveButton
                        shop={shop}
                        onRemoved={(id) => setItems((prev) => prev.filter((s) => s.id !== id))}
                      />
                    </div>

                    {!shop.isDisplayed && (
                      <p
                        className="flex w-full items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[12px] text-amber-800 dark:text-amber-300"
                        role="status"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          <span className="font-medium">Non affichée sur l&apos;accueil</span>
                          {' — '}
                          {reasons.length > 0 ? reasons.join(', ') : 'raison inconnue'}.
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
