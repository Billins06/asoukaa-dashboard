'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPartnerAction, updatePartnerAction } from '@/server/actions/partners-actions';
import type { PartnerListItem } from '@/lib/partners/types';

interface PartnerFormDialogProps {
  mode: 'create' | 'edit';
  partner?: PartnerListItem;
  children?: React.ReactNode;
}

export function PartnerFormDialog({ mode, partner, children }: PartnerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    part_name: partner?.part_name ?? '',
    part_logoUrl: partner?.part_logoUrl ?? '',
    part_websiteUrl: partner?.part_websiteUrl ?? '',
    description: partner?.description ?? '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        part_name: partner?.part_name ?? '',
        part_logoUrl: partner?.part_logoUrl ?? '',
        part_websiteUrl: partner?.part_websiteUrl ?? '',
        description: partner?.description ?? '',
      });
    }
  }, [open, partner]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.part_name.trim()) { toast.error('Le nom est obligatoire.'); return; }
    startTransition(async () => {
      const payload = {
        part_name: form.part_name.trim(),
        ...(form.part_logoUrl.trim() ? { part_logoUrl: form.part_logoUrl.trim() } : {}),
        ...(form.part_websiteUrl.trim() ? { part_websiteUrl: form.part_websiteUrl.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      };
      const result = mode === 'create'
        ? await createPartnerAction(payload)
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
    <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="space-y-1.5">
              <Label className="text-[13px]">Logo (URL)</Label>
              <Input placeholder="https://..." value={form.part_logoUrl} onChange={set('part_logoUrl')} className="text-[13px]" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
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
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
