'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
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

export async function approveRefundAction(id: string): Promise<ActionResult> {
  try {
    await api.patch(`/payments/refunds/${id}/approve`);
    revalidatePath('/dashboard/refunds');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function rejectRefundAction(
  id: string,
  motif?: string,
): Promise<ActionResult> {
  try {
    await api.patch(`/payments/refunds/${id}/reject`, motif ? { motif } : undefined);
    revalidatePath('/dashboard/refunds');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}
