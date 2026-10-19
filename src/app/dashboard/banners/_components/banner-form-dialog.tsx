'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/image-upload-field';
import { createBannerAction, updateBannerAction } from '@/server/actions/banners-actions';
import type { Banner, BannerPayload, BannerTargetType } from '@/lib/banners/types';
import { ToggleSwitch } from '@/app/dashboard/vitrine/_components/toggle-switch';
import { isoToLocalInput, localInputToIso } from '@/app/dashboard/vitrine/_components/vitrine-utils';
import { TARGET_OPTIONS } from './banner-utils';
import { TargetPicker, type PickedTarget } from './target-picker';

const TITRE_MAX = 120;
const SOUS_TITRE_MAX = 200;
const DURATION_MIN = 2;
const DURATION_MAX = 30;
const DURATION_DEFAULT = 4;

interface BannerFormDialogProps {
  mode: 'create' | 'edit';
  banner?: Banner;
  children?: React.ReactNode;
}

function initialForm(banner: Banner | undefined) {
  const picked: PickedTarget | null =
    banner && banner.targetType !== 'link' && banner.targetId
      ? { id: banner.targetId, label: banner.targetLabel ?? 'Cible introuvable' }
      : null;
  return {
    imageUrl: banner?.imageUrl ?? '',
    titre: banner?.titre ?? '',
    sousTitre: banner?.sousTitre ?? '',
    targetType: (banner?.targetType ?? 'category') as BannerTargetType,
    picked,
    targetUrl: banner?.targetType === 'link' ? (banner.targetUrl ?? '') : '',
    durationSeconds: String(banner?.durationSeconds ?? DURATION_DEFAULT),
    isActive: banner?.isActive ?? true,
    startsAt: isoToLocalInput(banner?.startsAt),
    endsAt: isoToLocalInput(banner?.endsAt),
  };
}

export function BannerFormDialog({ mode, banner, children }: BannerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(() => initialForm(banner));

  const handleOpenChange = (o: boolean) => {
    if (isPending || uploading) return; // pas de fermeture pendant un envoi
    if (o) setForm(initialForm(banner)); // réinitialise à l'ouverture
    setOpen(o);
  };

  const setField = (k: 'titre' | 'sousTitre' | 'targetUrl' | 'durationSeconds' | 'startsAt' | 'endsAt') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    const imageUrl = form.imageUrl.trim();
    if (!imageUrl) {
      toast.error("L'image de la bannière est obligatoire.");
      return;
    }
    const titre = form.titre.trim();
    const sousTitre = form.sousTitre.trim();
    if (titre.length > TITRE_MAX) {
      toast.error(`Le titre ne doit pas dépasser ${TITRE_MAX} caractères.`);
      return;
    }
    if (sousTitre.length > SOUS_TITRE_MAX) {
      toast.error(`Le sous-titre ne doit pas dépasser ${SOUS_TITRE_MAX} caractères.`);
      return;
    }

    let targetId: string | null = null;
    let targetUrl: string | null = null;
    if (form.targetType === 'link') {
      const url = form.targetUrl.trim();
      let ok = false;
      try {
        const u = new URL(url);
        ok = u.protocol === 'https:' && u.hostname.includes('.');
      } catch {
        ok = false;
      }
      if (!ok) {
        toast.error('Le lien doit être une adresse complète commençant par https://');
        return;
      }
      targetUrl = url;
    } else {
      if (!form.picked) {
        toast.error('Choisissez la catégorie, le produit ou la boutique visé.');
        return;
      }
      targetId = form.picked.id;
    }

    const duration = Number(form.durationSeconds);
    if (!Number.isInteger(duration) || duration < DURATION_MIN || duration > DURATION_MAX) {
      toast.error(`La durée doit être un nombre entier de secondes entre ${DURATION_MIN} et ${DURATION_MAX}.`);
      return;
    }

    const startsAt = localInputToIso(form.startsAt);
    const endsAt = localInputToIso(form.endsAt);
    if (form.startsAt && !startsAt) {
      toast.error('Date de début invalide.');
      return;
    }
    if (form.endsAt && !endsAt) {
      toast.error('Date de fin invalide.');
      return;
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      toast.error('La date de fin doit être postérieure à la date de début.');
      return;
    }

    const payload: BannerPayload = {
      imageUrl,
      titre: titre || null,
      sousTitre: sousTitre || null,
      targetType: form.targetType,
      targetId,
      targetUrl,
      durationSeconds: duration,
      isActive: form.isActive,
      startsAt,
      endsAt,
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createBannerAction(payload)
          : await updateBannerAction(banner!.id, payload);
      if (result.success) {
        toast.success(mode === 'create' ? 'Bannière créée' : 'Bannière mise à jour');
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const busy = isPending || uploading;
  const titreLength = form.titre.trim().length;
  const sousTitreLength = form.sousTitre.trim().length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle bannière
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {mode === 'create' ? 'Nouvelle bannière' : 'Modifier la bannière'}
          </DialogTitle>
          <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[13px]">
              Image <span className="text-destructive">*</span>
            </Label>
            <ImageUploadField
              type="vitrine"
              shape="banner"
              value={form.imageUrl}
              onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
              onUploadingChange={setUploading}
              disabled={isPending}
              allowRemove={false}
              hint="Image horizontale conseillée (ex : 1200 × 600 px)"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="banner-titre" className="text-[13px]">Titre (facultatif)</Label>
                <span className={`text-[11px] ${titreLength > TITRE_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {titreLength}/{TITRE_MAX}
                </span>
              </div>
              <Input
                id="banner-titre"
                placeholder="Ex : Tissus wax"
                value={form.titre}
                maxLength={TITRE_MAX + 20}
                onChange={setField('titre')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="banner-sous-titre" className="text-[13px]">Sous-titre (facultatif)</Label>
                <span className={`text-[11px] ${sousTitreLength > SOUS_TITRE_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {sousTitreLength}/{SOUS_TITRE_MAX}
                </span>
              </div>
              <Input
                id="banner-sous-titre"
                placeholder="Ex : Jusqu'à -40 %"
                value={form.sousTitre}
                maxLength={SOUS_TITRE_MAX + 20}
                onChange={setField('sousTitre')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">
              Où mène la bannière ? <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TARGET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isPending}
                    aria-pressed={form.targetType === opt.value}
                    onClick={() =>
                      setForm((p) =>
                        p.targetType === opt.value ? p : { ...p, targetType: opt.value, picked: null },
                      )
                    }
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                      form.targetType === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {form.targetType === 'link' ? (
              <div className="space-y-1">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://exemple.com/page"
                  value={form.targetUrl}
                  maxLength={500}
                  onChange={setField('targetUrl')}
                  className="text-[13px]"
                  disabled={isPending}
                />
                <p className="text-[11px] text-muted-foreground">
                  Le lien s&apos;ouvre dans le navigateur du téléphone. Seules les adresses en https:// sont acceptées.
                </p>
              </div>
            ) : (
              <TargetPicker
                // key : repart d'une recherche vide à chaque changement de type
                key={form.targetType}
                type={form.targetType}
                value={form.picked}
                onChange={(picked) => setForm((p) => ({ ...p, picked }))}
                disabled={isPending}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="banner-duree" className="text-[13px]">
                Durée d&apos;affichage (secondes)
              </Label>
              <Input
                id="banner-duree"
                type="number"
                min={DURATION_MIN}
                max={DURATION_MAX}
                step={1}
                value={form.durationSeconds}
                onChange={setField('durationSeconds')}
                className="text-[13px]"
                disabled={isPending}
              />
              <p className="text-[11px] text-muted-foreground">Entre {DURATION_MIN} et {DURATION_MAX} s.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Statut</Label>
              <label className="flex h-9 items-center gap-2 text-[13px]">
                <ToggleSwitch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                  disabled={isPending}
                  label="Bannière active"
                />
                {form.isActive ? 'Active' : 'Masquée'}
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="banner-debut" className="text-[13px]">Début (facultatif)</Label>
                <Input
                  id="banner-debut"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={setField('startsAt')}
                  className="text-[13px]"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner-fin" className="text-[13px]">Fin (facultatif)</Label>
                <Input
                  id="banner-fin"
                  type="datetime-local"
                  value={form.endsAt}
                  min={form.startsAt || undefined}
                  onChange={setField('endsAt')}
                  className="text-[13px]"
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sans dates, la bannière est affichée en permanence (si elle est active). Avec une date de fin,
              elle disparaît toute seule.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
