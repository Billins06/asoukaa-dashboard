import { toast } from 'sonner';

/**
 * Message affiché quand le serveur renvoie `remboursementManuelRequis: true`
 * (annulation d'une commande dont le paiement avait réussi). Le serveur ne rembourse
 * JAMAIS automatiquement : c'est à l'admin de le faire à la main, d'où un message
 * bien visible (jaune, plus long que les toasts habituels).
 */
export const MANUAL_REFUND_MESSAGE =
  'Cette commande était payée : un remboursement manuel est à effectuer.';

export function showManualRefundNotice(orderNumber?: string): void {
  toast.warning(MANUAL_REFUND_MESSAGE, {
    description: orderNumber ? `Commande ${orderNumber}` : undefined,
    duration: 15000,
  });
}
