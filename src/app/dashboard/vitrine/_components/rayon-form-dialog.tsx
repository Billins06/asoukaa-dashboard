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
import { createRayonAction, updateRayonAction } from '@/server/actions/vitrine-actions';
import type { Rayon, RayonType } from '@/lib/vitrine/types';
import { ToggleSwitch } from './toggle-switch';
import { RAYON_TYPE_OPTIONS, isoToLocalInput, localInputToIso } from './vitrine-utils';

const NOM_MAX = 120;

interface RayonFormDialogProps {
  mode: 'create' | 'edit';
  rayon?: Rayon;
  /** Ordre proposé par défaut à la création (fin de liste) */
  defaultSortOrder?: number;
  children?: React.ReactNode;
}

function initialForm(rayon: Rayon | undefined, defaultSortOrder: number) {
  return {
    nom: rayon?.nom ?? '',
    type: (rayon?.type ?? 'libre') as RayonType,
    imageUrl: rayon?.imageUrl ?? '',
    sortOrder: String(rayon?.sortOrder ?? defaultSortOrder),
    isActive: rayon?.isActive ?? true,
    startsAt: isoToLocalInput(rayon?.startsAt),
    endsAt: isoToLocalInput(rayon?.endsAt),
  };
}

export function RayonFormDialog({ mode, rayon, defaultSortOrder = 0, children }: RayonFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(() => initialForm(rayon, defaultSortOrder));

  const handleOpenChange = (o: boolean) => {
    if (isPending || uploading) return; // pas de fermeture pendant un envoi
    if (o) setForm(initialForm(rayon, defaultSortOrder)); // réinitialise à l'ouverture
    setOpen(o);
  };

  const setField = (k: 'nom' | 'sortOrder' | 'startsAt' | 'endsAt') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    const nom = form.nom.trim();
    if (!nom) {
      toast.error('Le nom est obligatoire.');
      return;
    }
    if (nom.length > NOM_MAX) {
      toast.error(`Le nom ne doit pas dépasser ${NOM_MAX} caractères.`);
      return;
    }
    const sortOrder = Number(form.sortOrder || '0');
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      toast.error("L'ordre doit être un entier positif ou nul.");
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
    const imageUrl = form.imageUrl.trim();

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createRayonAction({
              nom,
              type: form.type,
              sortOrder,
              isActive: form.isActive,
              ...(imageUrl ? { imageUrl } : {}),
              ...(startsAt ? { startsAt } : {}),
              ...(endsAt ? { endsAt } : {}),
            })
          : await updateRayonAction(rayon!.id, {
              nom,
              type: form.type,
              sortOrder,
              isActive: form.isActive,
              imageUrl: imageUrl || null,
              startsAt,
              endsAt,
            });
      if (result.success) {
        toast.success(mode === 'create' ? 'Rayon créé' : 'Rayon mis à jour');
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const busy = isPending || uploading;
  const nomLength = form.nom.trim().length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nouveau rayon
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {mode === 'create' ? 'Nouveau rayon' : 'Modifier le rayon'}
          </DialogTitle>
          <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="rayon-nom" className="text-[13px]">
                Nom <span className="text-destructive">*</span>
              </Label>
              <span className={`text-[11px] ${nomLength > NOM_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
                {nomLength}/{NOM_MAX}
              </span>
            </div>
            <Input
              id="rayon-nom"
              placeholder="Ex : Ventes flash du week-end"
              value={form.nom}
              maxLength={NOM_MAX + 20}
              onChange={setField('nom')}
              className="text-[13px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {RAYON_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => setForm((p) => ({ ...p, type: opt.value }))}
                  className={`px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors text-left ${
                    form.type === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Image (affichée en rond)</Label>
            <ImageUploadField
              type="vitrine"
              shape="round"
              value={form.imageUrl}
              onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
              onUploadingChange={setUploading}
              disabled={isPending}
              hint="Image carrée conseillée"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rayon-ordre" className="text-[13px]">Ordre d&apos;affichage</Label>
              <Input
                id="rayon-ordre"
                type="number"
                min={0}
                step={1}
                value={form.sortOrder}
                onChange={setField('sortOrder')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Statut</Label>
              <label className="flex h-9 items-center gap-2 text-[13px]">
                <ToggleSwitch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                  disabled={isPending}
                  label="Rayon actif"
                />
                {form.isActive ? 'Actif' : 'Inactif'}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rayon-debut" className="text-[13px]">Début (facultatif)</Label>
              <Input
                id="rayon-debut"
                type="datetime-local"
                value={form.startsAt}
                onChange={setField('startsAt')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rayon-fin" className="text-[13px]">Fin (facultatif)</Label>
              <Input
                id="rayon-fin"
                type="datetime-local"
                value={form.endsAt}
                min={form.startsAt || undefined}
                onChange={setField('endsAt')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Sans dates, le rayon est visible en permanence (s&apos;il est actif).
          </p>
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
