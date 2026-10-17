'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Gavel } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';
import { closeOrderDisputeAction } from '@/server/actions/orders-actions';
import { showManualRefundNotice } from '@/lib/orders/refund-notice';
import type { DisputeDecision } from '@/lib/orders/types';

interface DisputeCloseDialogProps {
  orderId: string;
  orderNumber: string;
  children: React.ReactNode;
}

const CHOICES: { value: DisputeDecision; label: string; hint: string }[] = [
  {
    value: 'rejete',
    label: 'Litige rejeté (la commande continue)',
    hint: 'La contestation du client n’est pas retenue : la commande reprend son cours.',
  },
  {
    value: 'fonde',
    label: 'Litige fondé (la commande est annulée, remboursement manuel si payée)',
    hint: 'Le client a raison : la commande est annulée. Le remboursement n’est pas automatique.',
  },
];

/** Fenêtre « Clore le litige » : choix de la décision, note, puis confirmation. */
export function DisputeCloseDialog({ orderId, orderNumber, children }: DisputeCloseDialogProps) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<DisputeDecision | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Le serveur exige une note d'au moins 3 caractères, quelle que soit la décision.
  const noteOk = note.trim().length >= 3;

  const reset = () => {
    setDecision(null);
    setNote('');
  };

  const handleOpenChange = (next: boolean) => {
    if (busy) return; // pas de fermeture pendant l'envoi
    setOpen(next);
    if (!next) reset();
  };

  const submit = async () => {
    if (!decision || !noteOk) return;
    setBusy(true);
    try {
      const result = await closeOrderDisputeAction(orderId, decision, note);
      if (result.success) {
        toast.success(
          decision === 'fonde'
            ? 'Litige clos : la commande est annulée'
            : 'Litige clos : la commande continue',
        );
        if (result.data.remboursementManuelRequis) showManualRefundNotice(orderNumber);
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    } catch {
      // La Server Action elle-même a échoué (coupure réseau…) : on le dit à l'admin.
      toast.error('Erreur réseau, réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const confirmText =
    decision === 'fonde'
      ? `La commande ${orderNumber} sera annulée et le client en sera informé par e-mail. Cette action est définitive.`
      : `Le litige de la commande ${orderNumber} sera clos sans suite : la commande reprend son cours.`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Clore le litige
          </DialogTitle>
          <DialogDescription>
            Commande <span className="font-mono font-medium">{orderNumber}</span> : le client a
            contesté la réception.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[12px] text-muted-foreground">Décision :</p>
          <div className="grid gap-2" role="radiogroup" aria-label="Décision sur le litige">
            {CHOICES.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={decision === c.value}
                onClick={() => setDecision(c.value)}
                disabled={busy}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors',
                  decision === c.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                )}
              >
                <span className="block text-[13px] font-medium">{c.label}</span>
                <span
                  className={cn(
                    'block text-[11px]',
                    decision === c.value ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {c.hint}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-litige" className="text-[13px]">
              Note de clôture <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="note-litige"
              placeholder="Pourquoi cette décision ? (3 caractères minimum)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              className="min-h-[80px] text-[13px] resize-none"
              disabled={busy}
            />
            <p className="text-[11px] text-muted-foreground">
              La note est enregistrée dans le journal d&apos;activité.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant={decision === 'fonde' ? 'destructive' : 'default'}
                disabled={busy || !decision || !noteOk}
              >
                Clore le litige
              </Button>
            }
            title={decision === 'fonde' ? 'Annuler la commande ?' : 'Rejeter le litige ?'}
            description={confirmText}
            confirmLabel={decision === 'fonde' ? 'Annuler la commande' : 'Rejeter le litige'}
            tone={decision === 'fonde' ? 'destructive' : 'default'}
            onConfirm={submit}
            disabled={busy || !decision || !noteOk}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
