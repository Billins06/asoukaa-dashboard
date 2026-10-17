'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil } from 'lucide-react';
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
import { createCategoryAction, updateCategoryAction } from '@/server/actions/categories-actions';
import type { CategoryFlat, CategoryNode } from '@/lib/categories/types';

interface CategoryFormDialogProps {
  mode: 'create' | 'edit';
  flatList: CategoryFlat[];
  category?: CategoryNode;
  defaultParentId?: string;
  children?: React.ReactNode;
}

export function CategoryFormDialog({
  mode,
  flatList,
  category,
  defaultParentId,
  children,
}: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: category?.name ?? '',
    parentId: category?.parentId ?? defaultParentId ?? '',
    imageUrl: category?.imageUrl ?? '',
    sortOrder: String(category?.sortOrder ?? '0'),
  });

  useEffect(() => {
    if (open) {
      setImageError(null);
      setForm({
        name: category?.name ?? '',
        parentId: category?.parentId ?? defaultParentId ?? '',
        imageUrl: category?.imageUrl ?? '',
        sortOrder: String(category?.sortOrder ?? '0'),
      });
    }
  }, [open, category, defaultParentId]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  // Catégorie principale = sans parent (le parent ne peut pas être modifié après création).
  const isRoot = mode === 'create' ? !form.parentId : !category?.parentId;
  // Une catégorie principale qui a déjà une image ne peut que la remplacer, pas la retirer.
  const imageLocked = mode === 'edit' && isRoot && !!category?.imageUrl;

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Le nom est obligatoire.');
      return;
    }
    // Catégorie principale (sans parent) : l'image est obligatoire à la création.
    if (mode === 'create' && isRoot && !form.imageUrl.trim()) {
      const msg = "L'image est obligatoire pour une catégorie principale.";
      setImageError(msg);
      toast.error(msg);
      return;
    }
    startTransition(async () => {
      const imageUrl = form.imageUrl.trim();
      const payload = {
        name: form.name.trim(),
        // Le serveur refuse tout champ parentId à la modification (même inchangé) : on ne l'envoie qu'à la création.
        ...(mode === 'create' ? { parentId: form.parentId || null } : {}),
        // Création : image omise si vide (sous-catégorie). Modification : null = retirer
        // l'image, sauf pour une catégorie principale (le serveur refuse de la retirer).
        ...(imageUrl ? { imageUrl } : mode === 'edit' && !isRoot ? { imageUrl: null } : {}),
        sortOrder: Number(form.sortOrder) || 0,
      };
      const result =
        mode === 'create'
          ? await createCategoryAction(payload)
          : await updateCategoryAction(category!.id, payload);
      if (result.success) {
        toast.success(mode === 'create' ? 'Catégorie créée' : 'Catégorie mise à jour');
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  // Only offer parents that are level 1 or 2 (can't nest deeper than level 3)
  const validParents = flatList.filter(
    (c) => c.level < 3 && c.id !== category?.id,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle catégorie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
          </DialogTitle>
          {mode === 'create' && (
            <DialogDescription>3 niveaux maximum (racine → sous → feuille).</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Nom <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Ex : Électronique"
              value={form.name}
              onChange={set('name')}
              className="text-[13px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Catégorie parente</Label>
            <select
              value={form.parentId}
              onChange={set('parentId')}
              disabled={isPending || mode === 'edit'}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Aucune (catégorie racine) —</option>
              {validParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {'  '.repeat(p.level - 1)}{p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Ordre d&apos;affichage</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.sortOrder}
                onChange={set('sortOrder')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">
              Image de la catégorie{' '}
              {isRoot && mode === 'create' && <span className="text-destructive">*</span>}
            </Label>
            <ImageUploadField
              type="categories"
              shape="round"
              value={form.imageUrl}
              onChange={(url) => {
                setImageError(null);
                setForm((p) => ({ ...p, imageUrl: url }));
              }}
              onUploadingChange={setUploading}
              disabled={isPending}
              allowRemove={!imageLocked}
              hint="Image carrée conseillée"
            />
            <p className="text-[11px] text-muted-foreground">
              Cette image s&apos;affiche dans le cercle de la catégorie sur l&apos;accueil.
            </p>
            {isRoot && (
              <p className="text-[11px] text-muted-foreground">
                {mode === 'create'
                  ? 'Obligatoire pour une catégorie principale (facultative pour une sous-catégorie).'
                  : imageLocked
                    ? "L'image d'une catégorie principale peut être remplacée mais pas supprimée."
                    : 'Une catégorie principale doit avoir une image : pensez à en ajouter une.'}
              </p>
            )}
            {imageError && (
              <p role="alert" className="text-[11px] text-destructive">
                {imageError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending || uploading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || uploading}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
