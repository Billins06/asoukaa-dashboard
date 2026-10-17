'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';

/** Même limite que le serveur (MarkPaymentReviewedDto). */
const MAX_TEXT = 500;

export interface ReviewedPaymentResult {
  message?: string;
  paymentId?: string;
  note?: string | null;
}

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    const msg = (error.body as { message?: unknown } | null)?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

/**
 * Marque un « paiement à examiner » comme traité (le dossier a été réglé à la
 * main). Le paiement sort de la liste et du compteur du menu. `note` facultative.
 */
export async function markPaymentReviewedAction(
  id: string,
  note?: string,
): Promise<ActionResult<ReviewedPaymentResult>> {
  try {
    const clean = note?.trim();
    if (clean && clean.length > MAX_TEXT) {
      return { success: false, error: `La note ne peut pas dépasser ${MAX_TEXT} caractères` };
    }
    const raw = await api.patch<unknown>(
      `/payments/${encodeURIComponent(id)}/reviewed`,
      clean ? { note: clean } : undefined,
    );
    revalidatePath('/dashboard/payments-to-review');
    revalidatePath('/dashboard', 'layout'); // rafraîchit le compteur du menu
    const data = (raw && typeof raw === 'object' ? raw : {}) as ReviewedPaymentResult;
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
