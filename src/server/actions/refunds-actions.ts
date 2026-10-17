'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';
import type { ApproveRefundResult, ProcessedRefundResult } from '@/lib/refunds/types';

/** Même limite que le serveur (MarkRefundProcessedDto / RejectRefundDto). */
const MAX_TEXT = 500;

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    const msg = (error.body as { message?: unknown } | null)?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

/** Réponse du serveur → objet simple (jamais d'exception si la forme est inattendue). */
function asObject<T>(raw: unknown): T {
  return (raw && typeof raw === 'object' ? raw : {}) as T;
}

export async function approveRefundAction(id: string): Promise<ActionResult<ApproveRefundResult>> {
  try {
    const raw = await api.patch<unknown>(`/payments/refunds/${encodeURIComponent(id)}/approve`);
    revalidatePath('/dashboard/refunds');
    return { success: true, data: asObject<ApproveRefundResult>(raw) };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

/**
 * Le motif de refus part sous le champ `motif` (nom attendu par RejectRefundDto).
 */
export async function rejectRefundAction(
  id: string,
  motif?: string,
): Promise<ActionResult> {
  try {
    const clean = motif?.trim();
    if (clean && clean.length > MAX_TEXT) {
      return { success: false, error: `Le motif ne peut pas dépasser ${MAX_TEXT} caractères` };
    }
    await api.patch(
      `/payments/refunds/${encodeURIComponent(id)}/reject`,
      clean ? { motif: clean } : undefined,
    );
    revalidatePath('/dashboard/refunds');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

/**
 * « Marquer comme traité » : l'argent a été rendu au client À LA MAIN.
 * Autorisé seulement depuis « approuvé » (sinon le serveur répond 400/404,
 * message affiché tel quel). `note` facultative, 500 caractères max.
 */
export async function markRefundProcessedAction(
  id: string,
  note?: string,
): Promise<ActionResult<ProcessedRefundResult>> {
  try {
    const clean = note?.trim();
    if (clean && clean.length > MAX_TEXT) {
      return { success: false, error: `La note ne peut pas dépasser ${MAX_TEXT} caractères` };
    }
    const raw = await api.patch<unknown>(
      `/payments/refunds/${encodeURIComponent(id)}/processed`,
      clean ? { note: clean } : undefined,
    );
    revalidatePath('/dashboard/refunds');
    return { success: true, data: asObject<ProcessedRefundResult>(raw) };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
