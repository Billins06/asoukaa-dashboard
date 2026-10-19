'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Images, Loader2, Pencil, Timer, Trash2 } from 'lucide-react';

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
  deleteBannerAction,
  reorderBannersAction,
  updateBannerAction,
} from '@/server/actions/banners-actions';
import type { Banner } from '@/lib/banners/types';
import { ToggleSwitch } from '@/app/dashboard/vitrine/_components/toggle-switch';
import { useHydrated } from '@/app/dashboard/vitrine/_components/use-hydrated';
import { formatPeriod } from '@/app/dashboard/vitrine/_components/vitrine-utils';
import { BannerFormDialog } from './banner-form-dialog';
import { STATUS_META, TARGET_OPTIONS, targetLabel } from './banner-utils';

// ─── Petits composants ─────────────────────────────────────

function StatusBadge({ banner }: { banner: Banner }) {
  const meta = STATUS_META[banner.status] ?? STATUS_META.inactive;
  return (
    <Badge variant="outline" className={`text-[11px] ${meta.className}`} title={meta.hint}>
      {meta.label}
    </Badge>
  );
}

function TargetCell({ banner }: { banner: Banner }) {
  const Icon = TARGET_OPTIONS.find((o) => o.value === banner.targetType)?.icon;
  const name = banner.targetType === 'link' ? banner.targetUrl : banner.targetLabel;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px]">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <span className="shrink-0 text-muted-foreground">{targetLabel(banner.targetType)} :</span>
      <span className={`truncate font-medium ${banner.targetValid ? '' : 'text-amber-600'}`}>
        {name ?? 'introuvable'}
      </span>
    </span>
  );
}

function PeriodCell({ banner }: { banner: Banner }) {
  const hydrated = useHydrated();
  if (!hydrated) return <span className="text-muted-foreground">…</span>;
  return <span className="text-muted-foreground">{formatPeriod(banner.startsAt, banner.endsAt)}</span>;
}

function ActiveSwitch({ banner }: { banner: Banner }) {
  const [isPending, startTransition] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <ToggleSwitch
        checked={banner.isActive}
        disabled={isPending}
        label={banner.isActive ? 'Masquer la bannière' : 'Activer la bannière'}
        onCheckedChange={(v) =>
          startTransition(async () => {
            const r = await updateBannerAction(banner.id, { isActive: v });
            if (!r.success) toast.error(r.error);
            else toast.success(v ? 'Bannière activée' : 'Bannière masquée');
          })
        }
      />
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </span>
  );
}

function DeleteBannerButton({ banner }: { banner: Banner }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      const r = await deleteBannerAction(banner.id);
      if (r.success) {
        toast.success('Bannière supprimée');
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
          <DialogTitle>Supprimer la bannière ?</DialogTitle>
          <DialogDescription>
            Elle sera supprimée définitivement et disparaîtra de l&apos;accueil de l&apos;application.
            Pour la garder sans l&apos;afficher, masquez-la plutôt.
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

function RowActions({ banner }: { banner: Banner }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <BannerFormDialog mode="edit" banner={banner}>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </BannerFormDialog>
      <DeleteBannerButton banner={banner} />
    </div>
  );
}

// ─── Liste ─────────────────────────────────────────────────

export function BannersClient({ banners }: { banners: Banner[] }) {
  const [isMoving, startMoving] = useTransition();

  const sorted = useMemo(
    () =>
      [...banners].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      ),
    [banners],
  );

  const total = sorted.length;
  const visible = sorted.filter((b) => b.status === 'visible').length;

  /** Déplace une bannière d'un cran puis envoie tout le nouvel ordre au serveur. */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    startMoving(async () => {
      const r = await reorderBannersAction(next.map((b) => b.id));
      if (!r.success) toast.error(`Réorganisation impossible : ${r.error}`);
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
          {total} bannière{total > 1 ? 's' : ''} · {visible} visible{visible > 1 ? 's' : ''} dans l&apos;appli
          {isMoving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </p>
        <BannerFormDialog mode="create" />
      </div>

      <Card>
        <CardContent className="p-0">
          {total === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Images className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune bannière pour le moment</p>
              <p className="text-[12px]">Sans bannière, la zone n&apos;apparaît pas sur l&apos;accueil.</p>
              <BannerFormDialog mode="create" />
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Ordre</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Bannière</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Durée</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Période</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Statut</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Actif</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((banner, i) => (
                      <tr key={banner.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="w-5 text-right text-[12px] text-muted-foreground">{i + 1}</span>
                            {renderMoveButtons(i)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ImagePreview
                              src={banner.imageUrl}
                              alt={banner.titre ?? 'Bannière'}
                              className="h-12 w-24 shrink-0 rounded-lg border border-border"
                            />
                            <div className="min-w-0 max-w-[280px] space-y-0.5">
                              <p className={`truncate font-medium ${banner.isActive ? '' : 'text-muted-foreground'}`}>
                                {banner.titre || <span className="italic text-muted-foreground">Sans titre</span>}
                              </p>
                              <TargetCell banner={banner} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Timer className="h-3.5 w-3.5" />
                            {banner.durationSeconds} s
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px]"><PeriodCell banner={banner} /></td>
                        <td className="px-4 py-3"><StatusBadge banner={banner} /></td>
                        <td className="px-4 py-3"><ActiveSwitch banner={banner} /></td>
                        <td className="px-4 py-3"><RowActions banner={banner} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border">
                {sorted.map((banner, i) => (
                  <div key={banner.id} className="space-y-2.5 px-4 py-3.5">
                    <ImagePreview
                      src={banner.imageUrl}
                      alt={banner.titre ?? 'Bannière'}
                      className="h-28 w-full rounded-lg border border-border"
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className={`truncate text-[13px] font-medium ${banner.isActive ? '' : 'text-muted-foreground'}`}>
                          {banner.titre || <span className="italic text-muted-foreground">Sans titre</span>}
                        </p>
                        <TargetCell banner={banner} />
                      </div>
                      <StatusBadge banner={banner} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        {banner.durationSeconds} s · <PeriodCell banner={banner} />
                      </span>
                      <ActiveSwitch banner={banner} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] text-muted-foreground">#{i + 1}</span>
                        {renderMoveButtons(i)}
                      </div>
                      <RowActions banner={banner} />
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
