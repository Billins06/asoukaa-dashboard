'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { REVIEW_STATUS } from '@/lib/status-meta';
import type { ReviewStatus } from '@/lib/reviews/types';
import type { ActionResult } from '@/types/api';

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    const msg = (error.body as { message?: unknown } | null)?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

/** Modération : le serveur attend « approuvé » ou « rejeté » (et refuse de re-modérer un avis déjà traité). */
export async function moderateReviewAction(
  id: string,
  status: Exclude<ReviewStatus, 'en attente'>,
): Promise<ActionResult> {
  if (status !== REVIEW_STATUS.APPROVED && status !== REVIEW_STATUS.REJECTED) {
    return { success: false, error: 'Statut de modération invalide.' };
  }
  try {
    await api.patch(`/reviews/${encodeURIComponent(id)}/moderate`, { status });
    revalidatePath('/dashboard/reviews');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
