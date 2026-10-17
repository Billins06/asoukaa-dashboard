'use client';

import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  /** Élément qui ouvre la confirmation (un <Button>, passé tel quel au déclencheur). */
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Style du bouton de confirmation : 'destructive' (rouge) pour une action risquée. */
  tone?: 'default' | 'destructive';
  /** Exécutée au clic sur « Confirmer ». La fenêtre reste ouverte (bouton bloqué) jusqu'à la fin. */
  onConfirm: () => Promise<void> | void;
  /** Bloque l'ouverture (ex. une autre action est déjà en cours). */
  disabled?: boolean;
}

/**
 * Confirmation avant une action sensible (suspendre un vendeur, bloquer un utilisateur,
 * désactiver un coupon…).
 *
 * - le bouton « Confirmer » est désactivé pendant l'exécution : impossible de
 *   déclencher l'action deux fois en cliquant vite ;
 * - la fenêtre ne se ferme qu'une fois l'action terminée (réussie ou non : le toast
 *   d'erreur de l'appelant s'affiche alors par-dessus la liste).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  tone = 'default',
  onConfirm,
  disabled,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm(e: React.MouseEvent) {
    // Radix ferme la fenêtre automatiquement au clic : on garde la main pour attendre la fin.
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
