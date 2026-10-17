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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { updateOrderStatusAction } from '@/server/actions/orders-actions';
import { showManualRefundNotice } from '@/lib/orders/refund-notice';
import {
  ORDER_STATUS,
  nextOrderStatuses,
  orderStatusMeta,
  type OrderStatus,
} from '@/lib/status-meta';

interface OrderStatusDialogProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  /** true = le client a un litige ouvert : « Livré » et « En transit » sont interdits. */
  disputeOuverte?: boolean;
  children: React.ReactNode;
}

export function OrderStatusDialog({
  orderId,
  orderNumber,
  currentStatus,
  disputeOuverte = false,
  children,
}: OrderStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRaw, setSelected] = useState<OrderStatus | null>(null);
  const [motif, setMotif] = useState('');
  const [isPending, startTransition] = useTransition();

  // Uniquement les passages que le serveur accepte pour l'admin
  // (sinon on afficherait des boutons qui finissent en erreur 400).
  const allOptions = nextOrderStatuses(currentStatus);
  // Litige ouvert : on ne peut pas livrer / mettre en transit (le litige resterait ouvert
  // sur une commande livrée et « fondé » échouerait). L'annulation reste possible.
  const options = disputeOuverte
    ? allOptions.filter((s) => s !== ORDER_STATUS.DELIVERED && s !== ORDER_STATUS.IN_TRANSIT)
    : allOptions;
  const disputeBlocks = options.length < allOptions.length;
  // Si le litige s'ouvre pendant que la fenêtre est ouverte, un choix devenu interdit est ignoré.
  const selected = selectedRaw !== null && options.includes(selectedRaw) ? selectedRaw : null;
  const isCancel = selected === ORDER_STATUS.CANCELLED;
  // Le serveur refuse un motif de moins de 3 caractères.
  const motifOk = motif.trim().length >= 3;
  // Livré / expédié / en transit posés à la main : le serveur n'enregistre alors aucune preuve.
  const skipsProof =
    selected === ORDER_STATUS.SHIPPED ||
    selected === ORDER_STATUS.IN_TRANSIT ||
    selected === ORDER_STATUS.DELIVERED;

  const handleOpenChange = (next: boolean) => {
    if (isPending) return; // pas de fermeture pendant l'envoi
    setOpen(next);
    if (!next) {
      setSelected(null);
      setMotif('');
    }
  };

  const handleSubmit = () => {
    if (!selected) return;
    if (isCancel && !motifOk) {
      toast.error("Le motif d'annulation est obligatoire (3 caractères minimum).");
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatusAction(
        orderId,
        selected,
        isCancel ? motif : undefined,
      );
      if (result.success) {
        toast.success('Statut mis à jour');
        // Annulation d'une commande payée : le serveur ne rembourse pas tout seul.
        if (result.data.remboursementManuelRequis) showManualRefundNotice(orderNumber);
        setOpen(false);
        setSelected(null);
        setMotif('');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            Statut actuel :
            <Badge
              variant="outline"
              className={cn('text-[11px]', orderStatusMeta(currentStatus).badge)}
            >
              {orderStatusMeta(currentStatus).label}
            </Badge>
          </div>

          {disputeBlocks && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-500">
              Un litige est ouvert : fermez-le d&apos;abord (bouton « Clore le litige ») avant de changer le statut vers Livré ou En transit.
            </p>
          )}

          {options.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[13px] text-muted-foreground">
              Cette commande est terminée : plus aucun changement de statut n&apos;est possible.
            </p>
          ) : (
            <>
              <p className="text-[12px] text-muted-foreground">Passer la commande à :</p>
              <div className="grid grid-cols-2 gap-2">
                {options.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelected(value)}
                    disabled={isPending}
                    aria-pressed={selected === value}
                    className={cn(
                      'px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors text-left',
                      selected === value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {orderStatusMeta(value).label}
                  </button>
                ))}
              </div>
            </>
          )}

          {skipsProof && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-500">
              Changement manuel : aucune preuve de livraison (photo, QR code) ne sera enregistrée pour ce passage.
            </p>
          )}

          {isCancel && (
            <div className="space-y-1.5">
              <Label htmlFor="motif" className="text-[13px]">
                Motif d&apos;annulation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motif"
                placeholder="Raison de l'annulation..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="min-h-[80px] text-[13px] resize-none"
                disabled={isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                L&apos;annulation est définitive et le client en est informé par e-mail. Si la
                commande était déjà payée, aucun remboursement n&apos;est fait automatiquement.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            variant={isCancel ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={isPending || !selected || (isCancel && !motifOk)}
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
