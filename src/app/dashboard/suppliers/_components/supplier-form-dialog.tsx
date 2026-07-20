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
import { createFournisseurAction, updateFournisseurAction } from '@/server/actions/fournisseurs-actions';
import type { FournisseurListItem, FournisseurCurrency } from '@/lib/fournisseurs/types';

const CURRENCIES: FournisseurCurrency[] = ['XOF', 'NGN', 'USD', 'EUR', 'GHS', 'CNY'];

interface SupplierFormDialogProps {
  mode: 'create' | 'edit';
  supplier?: FournisseurListItem;
  children?: React.ReactNode;
}

export function SupplierFormDialog({ mode, supplier, children }: SupplierFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    four_name: supplier?.four_name ?? '',
    contactPerson: supplier?.contactPerson ?? '',
    four_phone: supplier?.four_phone ?? '',
    four_email: supplier?.four_email ?? '',
    four_country: supplier?.four_country ?? '',
    four_ville: supplier?.four_ville ?? '',
    currency: (supplier?.currency ?? 'XOF') as FournisseurCurrency,
    delaiLivraison: String(supplier?.delaiLivraison ?? ''),
    notes: supplier?.notes ?? '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        four_name: supplier?.four_name ?? '',
        contactPerson: supplier?.contactPerson ?? '',
        four_phone: supplier?.four_phone ?? '',
        four_email: supplier?.four_email ?? '',
        four_country: supplier?.four_country ?? '',
        four_ville: supplier?.four_ville ?? '',
        currency: (supplier?.currency ?? 'XOF') as FournisseurCurrency,
        delaiLivraison: String(supplier?.delaiLivraison ?? ''),
        notes: supplier?.notes ?? '',
      });
    }
  }, [open, supplier]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.four_name.trim() || !form.contactPerson.trim() || !form.four_phone.trim() || !form.four_country.trim() || !form.four_ville.trim()) {
      toast.error('Nom, contact, téléphone, pays et ville sont obligatoires.');
      return;
    }
    startTransition(async () => {
      const payload = {
        four_name: form.four_name.trim(),
        contactPerson: form.contactPerson.trim(),
        four_phone: form.four_phone.trim(),
        four_country: form.four_country.trim(),
        four_ville: form.four_ville.trim(),
        currency: form.currency,
        ...(form.four_email.trim() ? { four_email: form.four_email.trim() } : {}),
        ...(form.delaiLivraison ? { delaiLivraison: Number(form.delaiLivraison) } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };
      const result = mode === 'create'
        ? await createFournisseurAction(payload)
        : await updateFournisseurAction(supplier!.id, payload);
      if (result.success) {
        toast.success(mode === 'create' ? 'Fournisseur créé' : 'Fournisseur mis à jour');
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
            Nouveau fournisseur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {mode === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[13px]">Nom <span className="text-destructive">*</span></Label>
              <Input placeholder="Ex : Fournisseur SN" value={form.four_name} onChange={set('four_name')} className="text-[13px]" disabled={isPending} />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[13px]">Contact <span className="text-destructive">*</span></Label>
              <Input placeholder="Nom du contact" value={form.contactPerson} onChange={set('contactPerson')} className="text-[13px]" disabled={isPending} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Téléphone <span className="text-destructive">*</span></Label>
              <Input placeholder="+225 07..." value={form.four_phone} onChange={set('four_phone')} className="text-[13px]" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Email</Label>
              <Input type="email" placeholder="contact@..." value={form.four_email} onChange={set('four_email')} className="text-[13px]" disabled={isPending} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Pays <span className="text-destructive">*</span></Label>
              <Input placeholder="Côte d'Ivoire" value={form.four_country} onChange={set('four_country')} className="text-[13px]" disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Ville <span className="text-destructive">*</span></Label>
              <Input placeholder="Abidjan" value={form.four_ville} onChange={set('four_ville')} className="text-[13px]" disabled={isPending} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Devise</Label>
              <select value={form.currency} onChange={set('currency')} disabled={isPending}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Délai livraison (jours)</Label>
              <Input type="number" min={1} placeholder="7" value={form.delaiLivraison} onChange={set('delaiLivraison')} className="text-[13px]" disabled={isPending} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Notes</Label>
            <Textarea placeholder="Notes internes..." value={form.notes} onChange={set('notes')} className="text-[13px] resize-none min-h-[60px]" disabled={isPending} />
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
