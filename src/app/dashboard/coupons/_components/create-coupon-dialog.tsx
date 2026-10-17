'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
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
import { createCouponAction } from '@/server/actions/coupons-actions';
import type { CouponType } from '@/lib/coupons/types';

const TYPE_OPTIONS: { value: CouponType; label: string }[] = [
  { value: 'pourcentage', label: 'Pourcentage (%)' },
  { value: 'prix fixe', label: 'Montant fixe (F CFA)' },
];

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    code: '',
    type: 'pourcentage' as CouponType,
    value: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.code.trim() || !form.value) {
      toast.error('Code et valeur sont obligatoires.');
      return;
    }
    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('La valeur doit être supérieure à 0.');
      return;
    }
    if (form.type === 'pourcentage' && value > 100) {
      toast.error('Un pourcentage ne peut pas dépasser 100.');
      return;
    }
    startTransition(async () => {
      const result = await createCouponAction({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value,
        ...(form.minOrderAmount ? { minOrderAmount: Number(form.minOrderAmount) } : {}),
        ...(form.maxUses ? { maxUses: Number(form.maxUses) } : {}),
        // Fin de journée (heure locale) : le coupon reste valable TOUT le jour choisi.
        ...(form.expiresAt ? { expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString() } : {}),
      });
      if (result.success) {
        toast.success('Coupon créé');
        setOpen(false);
        setForm({ code: '', type: 'pourcentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nouveau coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un coupon</DialogTitle>
          <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Code <span className="text-destructive">*</span></Label>
            <Input
              placeholder="PROMO20"
              value={form.code}
              onChange={set('code')}
              className="uppercase text-[13px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Type <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">
                {form.type === 'pourcentage' ? 'Valeur (%)' : 'Valeur (F CFA)'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                max={form.type === 'pourcentage' ? 100 : undefined}
                placeholder={form.type === 'pourcentage' ? '20' : '5000'}
                value={form.value}
                onChange={set('value')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Commande min. (F)</Label>
              <Input
                type="number"
                min={0}
                placeholder="10000"
                value={form.minOrderAmount}
                onChange={set('minOrderAmount')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Utilisations max.</Label>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={form.maxUses}
                onChange={set('maxUses')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Expiration</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={set('expiresAt')}
                className="text-[13px]"
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
