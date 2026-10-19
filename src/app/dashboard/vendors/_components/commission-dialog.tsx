'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Percent } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setVendorCommissionAction } from '@/server/actions/vendors-actions';
import { formatFCFA, toNumber } from '@/lib/format';
import type { VendorListItem } from '@/lib/vendors/types';

type Mode = 'default' | 'percent' | 'fixed';

/** Texte court de la commission d'un vendeur (colonne « Commission »). */
export function commissionLabel(v: Pick<VendorListItem, 'commissionType' | 'commissionValue'>): string {
  if (v.commissionType === 'percent' && v.commissionValue != null) {
    return `${String(toNumber(v.commissionValue)).replace('.', ',')} %`;
  }
  if (v.commissionType === 'fixed' && v.commissionValue != null) {
    return `${formatFCFA(v.commissionValue)} / commande`;
  }
  return '10 % (défaut)';
}

const OPTIONS: { value: Mode; label: string; help: string }[] = [
  { value: 'default', label: 'Par défaut (10 %)', help: 'La commission normale de la plateforme.' },
  { value: 'percent', label: 'Pourcentage', help: 'Un % du prix des produits vendus (hors livraison).' },
  { value: 'fixed', label: 'Montant fixe', help: 'Une somme en FCFA prélevée à chaque commande, quel que soit son montant.' },
];

export function CommissionDialog({
  vendor,
  open,
  onOpenChange,
}: {
  vendor: VendorListItem;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const initialMode: Mode = vendor.commissionType === 'percent' || vendor.commissionType === 'fixed'
    ? vendor.commissionType
    : 'default';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [value, setValue] = useState(
    vendor.commissionValue != null ? String(toNumber(vendor.commissionValue)) : '',
  );
  const [isPending, startTransition] = useTransition();

  // (Le dialogue est monté à chaque ouverture : il repart de la valeur actuelle du vendeur.)
  const handleOpenChange = (o: boolean) => onOpenChange(o);

  const cleaned = value.trim().replace(',', '.');
  const num = Number(cleaned);
  const valueOk =
    mode === 'default' ||
    (/^\d+(\.\d{1,2})?$/.test(cleaned) && Number.isFinite(num) && (mode !== 'percent' || num <= 100));
  const showError = mode !== 'default' && value.trim() !== '' && !valueOk;

  const submit = () => {
    if (!valueOk) {
      toast.error(mode === 'percent' ? 'Entrez un pourcentage entre 0 et 100.' : 'Entrez un montant positif.');
      return;
    }
    startTransition(async () => {
      try {
        const r = await setVendorCommissionAction(vendor.id, mode, mode === 'default' ? undefined : num);
        if (r.success) {
          toast.success('Commission enregistrée pour les prochaines commandes.');
          onOpenChange(false);
        } else {
          toast.error(r.error);
        }
      } catch {
        toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Commission de « {vendor.shopName} »
          </DialogTitle>
          <DialogDescription>
            S&apos;applique aux commandes payées à partir de maintenant. Les commissions déjà calculées ne changent pas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" role="radiogroup" aria-label="Type de commission">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-[13px] ${
                mode === o.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input
                type="radio"
                name={`commission-${vendor.id}`}
                className="mt-0.5"
                checked={mode === o.value}
                onChange={() => {
                  // Pourcentage ↔ montant : on ne garde pas l'ancienne valeur (8 % ≠ 8 FCFA).
                  if (o.value !== mode && o.value !== initialMode) setValue('');
                  setMode(o.value);
                }}
                disabled={isPending}
              />
              <span>
                <span className="font-medium">{o.label}</span>
                <span className="block text-[12px] text-muted-foreground">{o.help}</span>
              </span>
            </label>
          ))}
        </div>

        {mode !== 'default' && (
          <div className="space-y-1.5">
            <Label htmlFor={`commission-value-${vendor.id}`} className="text-[13px]">
              {mode === 'percent' ? 'Pourcentage (%)' : 'Montant par commande (FCFA)'}
            </Label>
            <Input
              id={`commission-value-${vendor.id}`}
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === 'percent' ? 'Ex : 8' : 'Ex : 500'}
              className="h-9 text-[13px]"
              disabled={isPending}
              aria-invalid={showError}
              aria-describedby={showError ? `commission-error-${vendor.id}` : undefined}
            />
            {showError && (
              <p id={`commission-error-${vendor.id}`} className="text-[11px] text-destructive">
                {mode === 'percent'
                  ? 'Entrez un nombre entre 0 et 100 (2 décimales maximum).'
                  : 'Entrez un montant positif en chiffres (ex : 500).'}
              </p>
            )}
            {mode === 'fixed' && (
              <p className="text-[11px] text-muted-foreground">
                Si la commande est inférieure à ce montant, la commission est limitée au total des produits.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={isPending || !valueOk}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
