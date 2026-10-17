'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { CreateCouponPayload } from '@/lib/coupons/types';
import type { ActionResult } from '@/types/api';

export async function createCouponAction(
  payload: CreateCouponPayload,
): Promise<ActionResult> {
  try {
    await api.post('/coupons', payload);
    revalidatePath('/dashboard/coupons');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function deactivateCouponAction(id: string): Promise<ActionResult> {
  try {
    await api.patch(`/coupons/${id}/deactivate`);
    revalidatePath('/dashboard/coupons');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      typeof error.body === 'object' &&
      error.body !== null &&
      'message' in error.body
    ) {
      const msg = (error.body as { message: unknown }).message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }
    return error.message;
  }
  return 'Erreur inattendue';
}
