'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
import { approveRefundAction, rejectRefundAction } from '@/server/actions/refunds-actions';
import { formatXOFCompact } from '../../_lib/format';

interface RefundActionDialogProps {
  id: string;
  orderNumber: string;
  montantRemb: number;
  action: 'approve' | 'reject';
}

export function RefundActionDialog({
  id,
  orderNumber,
  montantRemb,
  action,
}: RefundActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState('');
  const [isPending, startTransition] = useTransition();

  const isApprove = action === 'approve';

  const handleSubmit = () => {
    if (!isApprove && !motif.trim()) {
      toast.error('Le motif de refus est obligatoire.');
      return;
    }
    startTransition(async () => {
      const result = isApprove
        ? await approveRefundAction(id)
        : await rejectRefundAction(id, motif.trim());
      if (result.success) {
        toast.success(isApprove ? 'Remboursement approuvé' : 'Remboursement refusé');
        setOpen(false);
        setMotif('');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Refuser
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            {isApprove ? 'Approuver le remboursement' : 'Refuser le remboursement'}
          </DialogTitle>
          <DialogDescription>
            Commande{' '}
            <span className="font-mono font-medium">{orderNumber}</span> —{' '}
            <span className="font-medium">{formatXOFCompact(montantRemb)}</span>
          </DialogDescription>
        </DialogHeader>

        {!isApprove && (
          <div className="space-y-1.5">
            <Label className="text-[13px]">
              Motif de refus <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Raison du refus..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="min-h-[80px] text-[13px] resize-none"
              disabled={isPending}
            />
          </div>
        )}

        {isApprove && (
          <p className="text-[13px] text-muted-foreground">
            Confirmer l'approbation de ce remboursement de{' '}
            <span className="font-medium text-foreground">{formatXOFCompact(montantRemb)}</span> ?
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
