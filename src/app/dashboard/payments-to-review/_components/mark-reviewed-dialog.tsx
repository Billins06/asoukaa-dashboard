'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, PackageCheck } from 'lucide-react';
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
import { markPaymentReviewedAction } from '@/server/actions/payments-review-actions';
import { formatFCFA } from '@/lib/format';

/** Limite du serveur pour la note. */
const MAX_TEXT = 500;

interface MarkReviewedDialogProps {
  id: string;
  orderNumber: string;
  montant: string | number;
}

export function MarkReviewedDialog({ id, orderNumber, montant }: MarkReviewedDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) setNote('');
  };

  const handleSubmit = () => {
    if (isPending) return;
    const clean = note.trim();
    if (clean.length > MAX_TEXT) {
      toast.error(`Maximum ${MAX_TEXT} caractères.`);
      return;
    }
    startTransition(async () => {
      try {
        const result = await markPaymentReviewedAction(id, clean || undefined);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(result.data.message || 'Paiement marqué comme traité');
        setOpen(false);
        setNote('');
      } catch {
        toast.error('Erreur inattendue. Réessayez.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] text-blue-600 border-blue-500/40 hover:bg-blue-500/5"
        >
          <PackageCheck className="h-3 w-3 mr-1" />
          Marquer comme traité
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-blue-600" />
            Marquer comme traité
          </DialogTitle>
          <DialogDescription>
            Commande <span className="font-mono font-medium">{orderNumber}</span> —{' '}
            <span className="font-medium">{formatFCFA(montant)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Confirmez que ce dossier a été réglé (client remboursé ou commande rejouée). Le
            paiement disparaît de cette liste ; rien d&apos;autre n&apos;est modifié.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor={`note-examen-${id}`} className="text-[13px]">
              Note (facultative)
            </Label>
            <Textarea
              id={`note-examen-${id}`}
              placeholder="Ex. : client remboursé par Mobile Money, réf. 123456"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={MAX_TEXT}
              className="min-h-[80px] text-[13px] resize-none"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
