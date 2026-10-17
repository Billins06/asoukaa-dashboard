'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
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

export async function markCommissionPaidAction(id: string): Promise<ActionResult> {
  try {
    await api.post(`/admin/commissions/${encodeURIComponent(id)}/mark-paid`);
    revalidatePath('/dashboard/commissions');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
