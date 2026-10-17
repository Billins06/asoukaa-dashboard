'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isOrderStatus, ORDER_STATUS } from '@/lib/status-meta';
import type { DisputeDecision, OrderAdminResult, OrderStatus } from '@/lib/orders/types';
import type { ActionResult } from '@/types/api';

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  motifAnnulation?: string,
): Promise<ActionResult<OrderAdminResult>> {
  // Garde-fou : une Server Action est un point d'entrée public, on ne fait pas
  // confiance au type TypeScript du client.
  if (!isOrderStatus(status)) {
    return { success: false, error: 'Statut invalide.' };
  }
  const motif = motifAnnulation?.trim();
  // Le serveur exige au moins 3 caractères (après suppression des espaces).
  if (status === ORDER_STATUS.CANCELLED && (!motif || motif.length < 3)) {
    return {
      success: false,
      error: "Le motif d'annulation est obligatoire (3 caractères minimum).",
    };
  }
  try {
    const res = await api.patch<{ remboursementManuelRequis?: unknown; orderNumber?: unknown } | null>(
      `/orders/${encodeURIComponent(orderId)}/admin-status`,
      {
        status,
        ...(status === ORDER_STATUS.CANCELLED && motif ? { motifAnnulation: motif } : {}),
      },
    );
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/late-confirmation');
    revalidatePath('/dashboard/payments-to-review');
    return { success: true, data: toAdminResult(res) };
  } catch (error) {
    unstable_rethrow(error);
    // api.ts fabrique déjà un message lisible (tableau de messages class-validator inclus).
    const msg = error instanceof ApiError ? error.message : 'Erreur inattendue';
    return { success: false, error: msg };
  }
}

/**
 * Clôture d'un litige ouvert par le client (PATCH /orders/:id/admin-close-dispute).
 *  - 'rejete' : litige non fondé, la commande reprend son cours ;
 *  - 'fonde'  : litige fondé, la commande est ANNULÉE (remboursement manuel si payée).
 * Le serveur exige une note (3 caractères minimum) dans les deux cas.
 */
export async function closeOrderDisputeAction(
  orderId: string,
  decision: DisputeDecision,
  note: string,
): Promise<ActionResult<OrderAdminResult>> {
  if (decision !== 'rejete' && decision !== 'fonde') {
    return { success: false, error: 'Décision invalide.' };
  }
  const cleanNote = note.trim();
  if (cleanNote.length < 3) {
    return { success: false, error: 'La note de clôture est obligatoire (3 caractères minimum).' };
  }
  if (cleanNote.length > 1000) {
    return { success: false, error: 'La note est trop longue (1000 caractères maximum).' };
  }
  try {
    const res = await api.patch<{ remboursementManuelRequis?: unknown; orderNumber?: unknown } | null>(
      `/orders/${encodeURIComponent(orderId)}/admin-close-dispute`,
      { decision, note: cleanNote },
    );
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/late-confirmation');
    revalidatePath('/dashboard/payments-to-review');
    return { success: true, data: toAdminResult(res) };
  } catch (error) {
    unstable_rethrow(error);
    const msg = error instanceof ApiError ? error.message : 'Erreur inattendue';
    return { success: false, error: msg };
  }
}

/** Lit la réponse du serveur sans rien inventer : absent ou illisible = pas de remboursement signalé. */
function toAdminResult(
  res: { remboursementManuelRequis?: unknown; orderNumber?: unknown } | null,
): OrderAdminResult {
  return {
    remboursementManuelRequis: res?.remboursementManuelRequis === true,
    ...(typeof res?.orderNumber === 'string' ? { orderNumber: res.orderNumber } : {}),
  };
}
