'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/image-upload-field';
import { createPartnerAction, updatePartnerAction } from '@/server/actions/partners-actions';
import { safeHttpUrl } from '@/lib/safe-url';
import type { PartnerListItem, UpdatePartnerPayload } from '@/lib/partners/types';

interface PartnerFormDialogProps {
  mode: 'create' | 'edit';
  partner?: PartnerListItem;
  children?: React.ReactNode;
}

export function PartnerFormDialog({ mode, partner, children }: PartnerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Envoi du logo en cours : on bloque l'enregistrement tant que l'image n'est pas arrivée.
  const [uploading, setUploading] = useState(false);
  const initialForm = () => ({
    part_name: partner?.part_name ?? '',
    part_logoUrl: partner?.part_logoUrl ?? '',
    part_websiteUrl: partner?.part_websiteUrl ?? '',
    description: partner?.description ?? '',
  });
  const [form, setForm] = useState(initialForm);

  // À chaque ouverture, le formulaire repart des données actuelles du partenaire
  // (fait ici plutôt que dans un effet : évite un rendu en cascade).
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setForm(initialForm());
      setUploading(false);
    }
    setOpen(next);
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    if (uploading) { toast.error("Attendez la fin de l'envoi du logo."); return; }
    if (!form.part_name.trim()) { toast.error('Le nom est obligatoire.'); return; }
    if (form.part_websiteUrl.trim() && !safeHttpUrl(form.part_websiteUrl)) {
      toast.error("L'adresse du site web doit commencer par http:// ou https://.");
      return;
    }
    startTransition(async () => {
      const logo = form.part_logoUrl.trim();
      // Logo vidé sur un partenaire qui en avait un : null (le serveur refuse la chaîne vide).
      const logoRemoved = mode === 'edit' && !logo && !!partner?.part_logoUrl;
      const payload: UpdatePartnerPayload & { part_name: string } = {
        part_name: form.part_name.trim(),
        ...(logo ? { part_logoUrl: logo } : logoRemoved ? { part_logoUrl: null } : {}),
        ...(form.part_websiteUrl.trim() ? { part_websiteUrl: form.part_websiteUrl.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      };
      const result = mode === 'create'
        ? await createPartnerAction({ ...payload, part_logoUrl: logo || undefined })
        : await updatePartnerAction(partner!.id, payload);
      if (result.success) {
        toast.success(mode === 'create' ? 'Partenaire créé' : 'Partenaire mis à jour');
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nouveau partenaire
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {mode === 'create' ? 'Nouveau partenaire' : 'Modifier le partenaire'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Nom <span className="text-destructive">*</span></Label>
            <Input placeholder="Ex : DHL Africa" value={form.part_name} onChange={set('part_name')} className="text-[13px]" disabled={isPending} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[13px]">Logo</Label>
              <ImageUploadField
                type="vitrine"
                shape="banner"
                value={form.part_logoUrl}
                onChange={(url) => setForm((p) => ({ ...p, part_logoUrl: url }))}
                onUploadingChange={setUploading}
                disabled={isPending}
                hint="Logo sur fond clair conseillé"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[13px]">Site web (URL)</Label>
              <Input placeholder="https://..." value={form.part_websiteUrl} onChange={set('part_websiteUrl')} className="text-[13px]" disabled={isPending} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Description</Label>
            <Textarea placeholder="Description du partenaire..." value={form.description} onChange={set('description')} className="text-[13px] resize-none min-h-[80px]" disabled={isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending || uploading}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
