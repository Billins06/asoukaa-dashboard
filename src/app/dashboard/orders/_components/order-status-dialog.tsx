'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
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
import { updateOrderStatusAction } from '@/server/actions/orders-actions';
import type { OrderStatus } from '@/lib/orders/types';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'PREPARING', label: 'En préparation' },
  { value: 'SHIPPED', label: 'Expédié' },
  { value: 'DELIVERED', label: 'Livré' },
  { value: 'CANCELLED', label: 'Annulé' },
];

interface OrderStatusDialogProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  children: React.ReactNode;
}

export function OrderStatusDialog({
  orderId,
  orderNumber,
  currentStatus,
  children,
}: OrderStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OrderStatus>(currentStatus);
  const [motif, setMotif] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (selected === 'CANCELLED' && !motif.trim()) {
      toast.error('Le motif d\'annulation est obligatoire.');
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatusAction(
        orderId,
        selected,
        selected === 'CANCELLED' ? motif : undefined,
      );
      if (result.success) {
        toast.success('Statut mis à jour');
        setOpen(false);
        setMotif('');
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
            <RefreshCw className="h-4 w-4" />
            Modifier le statut
          </DialogTitle>
          <DialogDescription>
            Commande <span className="font-mono font-medium">{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors text-left ${
                  selected === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {selected === 'CANCELLED' && (
            <div className="space-y-1.5">
              <Label htmlFor="motif" className="text-[13px]">
                Motif d'annulation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motif"
                placeholder="Raison de l'annulation..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="min-h-[80px] text-[13px] resize-none"
                disabled={isPending}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || selected === currentStatus}
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
