'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
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

export async function moderateReviewAction(
  id: string,
  status: Exclude<ReviewStatus, 'PENDING'>,
): Promise<ActionResult> {
  try {
    await api.patch(`/reviews/${id}/moderate`, { status });
    revalidatePath('/dashboard/reviews');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}
