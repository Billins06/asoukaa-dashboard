'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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
import { reviewVendorAction } from '@/server/actions/vendors-actions';
import type { VendorListItem, VendorPendingItem } from '@/lib/vendors/types';

type Vendor = Pick<VendorListItem | VendorPendingItem, 'id' | 'shopName'> & {
  user: { prenom: string; name: string };
};

interface ReviewDialogProps {
  vendor: Vendor;
  action: 'approve' | 'reject';
  children: React.ReactNode;
}

export function ReviewDialog({ vendor, action, children }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (action === 'reject' && !reason.trim()) {
      toast.error('Le motif de refus est obligatoire.');
      return;
    }
    startTransition(async () => {
      const result = await reviewVendorAction(vendor.id, action, reason || undefined);
      if (result.success) {
        toast.success(action === 'approve' ? 'Vendeur approuvé !' : 'Vendeur refusé.');
        setOpen(false);
        setReason('');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            {action === 'approve' ? 'Approuver le vendeur' : 'Refuser la candidature'}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? `Confirmer l'approbation de ${vendor.user.prenom} ${vendor.user.name} (${vendor.shopName}) ?`
              : `Vous allez refuser la candidature de ${vendor.user.prenom} ${vendor.user.name} pour « ${vendor.shopName} ».`}
          </DialogDescription>
        </DialogHeader>

        {action === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-[13px]">
              Motif de refus <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi la candidature est refusée..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] text-[13px] resize-none"
              disabled={isPending}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (action === 'reject' && !reason.trim())}
            className={action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            variant={action === 'reject' ? 'destructive' : 'default'}
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {action === 'approve' ? 'Approuver' : 'Refuser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
