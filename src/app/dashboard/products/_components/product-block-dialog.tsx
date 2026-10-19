'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Ban, CheckCircle2, Loader2 } from 'lucide-react';
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
import { setProductBlockedAction } from '@/server/actions/products-actions';

interface Props {
  productId: string;
  productName: string;
  /** true = le produit est actuellement désactivé par l'admin → on propose de le réactiver. */
  blocked: boolean;
  children: React.ReactNode;
}

export function ProductBlockDialog({ productId, productName, blocked, children }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  // Action demandée, figée à l'ouverture (la prop `blocked` change après succès,
  // pendant l'animation de fermeture : le titre ne doit pas basculer).
  const [disable, setDisable] = useState(!blocked);
  const handleOpenChange = (o: boolean) => {
    if (o) setDisable(!blocked);
    else setReason('');
    setOpen(o);
  };

  const submit = () => {
    if (disable && reason.trim().length < 3) {
      toast.error('Indiquez le motif (3 caractères minimum).');
      return;
    }
    startTransition(async () => {
      try {
        const result = await setProductBlockedAction(
          productId,
          disable,
          disable ? reason.trim() : undefined,
        );
        if (result.success) {
          toast.success(disable ? 'Produit désactivé. Le vendeur est prévenu.' : 'Produit réactivé.');
          setOpen(false);
          setReason('');
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Le serveur ne répond pas. Réessayez dans un instant.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {disable ? (
              <Ban className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
            {disable ? 'Désactiver ce produit' : 'Réactiver ce produit'}
          </DialogTitle>
          <DialogDescription>
            {disable
              ? `« ${productName} » ne sera plus visible ni achetable. Le vendeur ne pourra pas le remettre en vente lui-même. Les clients qui l'ont déjà acheté (livre numérique compris) gardent leur accès.`
              : `« ${productName} » retrouvera son statut d'avant la désactivation et redeviendra modifiable par le vendeur.`}
          </DialogDescription>
        </DialogHeader>

        {disable && (
          <div className="space-y-2">
            <Label htmlFor="block-reason" className="text-[13px]">
              Motif <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="block-reason"
              placeholder="Ex : contenu non conforme, signalement d'un client…"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[90px] text-[13px] resize-none"
              disabled={isPending}
            />
            <p className="text-[11px] text-muted-foreground">
              Ce motif est envoyé au vendeur.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={isPending || (disable && reason.trim().length < 3)}
            variant={disable ? 'destructive' : 'default'}
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {disable ? 'Désactiver' : 'Réactiver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
