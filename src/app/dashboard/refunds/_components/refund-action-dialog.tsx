'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
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
import {
  approveRefundAction,
  rejectRefundAction,
  markRefundProcessedAction,
} from '@/server/actions/refunds-actions';
import { formatFCFA } from '@/lib/format';
import type { ApproveRefundResult } from '@/lib/refunds/types';

/** Limite du serveur pour le motif de refus et la note « traité ». */
const MAX_TEXT = 500;

interface RefundActionDialogProps {
  id: string;
  orderNumber: string;
  montantRemb: string | number;
  action: 'approve' | 'reject' | 'processed';
}

function positive(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Résumé de la reprise sur les gains du vendeur (réponse de l'approbation). */
function describeClawback(data: ApproveRefundResult): { text?: string; debt: boolean } {
  const parts: string[] = [];
  const reprise = data.repriseGains;
  if (reprise) {
    if (reprise.dejaRepris) {
      parts.push('La reprise sur les gains du vendeur avait déjà été faite.');
    } else if (positive(reprise.montantVendeur) > 0) {
      parts.push(`Part reprise au vendeur : ${formatFCFA(reprise.montantVendeur)}.`);
    }
    if (reprise.note) parts.push(reprise.note);
  }
  const dette = positive(data.detteVendeur);
  if (dette > 0) {
    parts.push(
      `Le vendeur avait déjà retiré cet argent : il est en dette de ${formatFCFA(dette)}.`,
    );
  }
  return { text: parts.length ? parts.join(' ') : undefined, debt: dette > 0 };
}

export function RefundActionDialog({
  id,
  orderNumber,
  montantRemb,
  action,
}: RefundActionDialogProps) {
  const [open, setOpen] = useState(false);
  // Motif de refus (obligatoire) OU note « traité » (facultative) selon l'action.
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();

  const isApprove = action === 'approve';
  const isReject = action === 'reject';
  const isProcessed = action === 'processed';

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    setOpen(next);
    if (!next) setText('');
  };

  const handleSubmit = () => {
    if (isPending) return;
    const clean = text.trim();
    if (isReject && !clean) {
      toast.error('Le motif de refus est obligatoire.');
      return;
    }
    if (clean.length > MAX_TEXT) {
      toast.error(`Maximum ${MAX_TEXT} caractères.`);
      return;
    }
    startTransition(async () => {
      try {
        if (isApprove) {
          const result = await approveRefundAction(id);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          const { text: summary, debt } = describeClawback(result.data);
          if (debt) {
            toast.warning('Remboursement approuvé', { description: summary, duration: 15000 });
          } else {
            toast.success('Remboursement approuvé', {
              description: summary,
              duration: summary ? 10000 : undefined,
            });
          }
        } else if (isReject) {
          const result = await rejectRefundAction(id, clean);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success('Remboursement refusé');
        } else {
          const result = await markRefundProcessedAction(id, clean || undefined);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success(result.data.message || 'Remboursement marqué comme traité');
        }
        setOpen(false);
        setText('');
      } catch {
        toast.error('Erreur inattendue. Réessayez.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isApprove ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approuver
          </Button>
        ) : isReject ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Refuser
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] text-blue-600 border-blue-500/40 hover:bg-blue-500/5"
          >
            <PackageCheck className="h-3 w-3 mr-1" />
            Marquer comme traité
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : isReject ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <PackageCheck className="h-4 w-4 text-blue-600" />
            )}
            {isApprove
              ? 'Approuver le remboursement'
              : isReject
                ? 'Refuser le remboursement'
                : 'Marquer comme traité'}
          </DialogTitle>
          <DialogDescription>
            Commande{' '}
            <span className="font-mono font-medium">{orderNumber}</span> —{' '}
            <span className="font-medium">{formatFCFA(montantRemb)}</span>
          </DialogDescription>
        </DialogHeader>

        {isReject && (
          <div className="space-y-1.5">
            <Label htmlFor={`motif-refus-${id}`} className="text-[13px]">
              Motif de refus <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={`motif-refus-${id}`}
              placeholder="Raison du refus..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_TEXT}
              className="min-h-[80px] text-[13px] resize-none"
              disabled={isPending}
            />
          </div>
        )}

        {isApprove && (
          <p className="text-[13px] text-muted-foreground">
            Confirmer l&apos;approbation de ce remboursement de{' '}
            <span className="font-medium text-foreground">{formatFCFA(montantRemb)}</span> ?
            Le client en sera informé par e-mail.
          </p>
        )}

        {isProcessed && (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              Confirmez que l&apos;argent a bien été rendu au client (à la main). Aucun montant
              n&apos;est modifié : seul le statut passe à « traité ».
            </p>
            <div className="space-y-1.5">
              <Label htmlFor={`note-traite-${id}`} className="text-[13px]">
                Note (facultative)
              </Label>
              <Textarea
                id={`note-traite-${id}`}
                placeholder="Ex. : remboursé par Mobile Money, réf. 123456"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_TEXT}
                className="min-h-[80px] text-[13px] resize-none"
                disabled={isPending}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            variant={isReject ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={isPending || (isReject && !text.trim())}
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
