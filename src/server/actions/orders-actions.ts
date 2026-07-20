'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { OrderStatus } from '@/lib/orders/types';
import type { ActionResult } from '@/types/api';

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  motifAnnulation?: string,
): Promise<ActionResult> {
  try {
    await api.patch(`/orders/${orderId}/admin-status`, {
      status,
      ...(motifAnnulation ? { motifAnnulation } : {}),
    });
    revalidatePath('/dashboard/orders');
    return { success: true, data: undefined };
  } catch (error) {
    const msg =
      error instanceof ApiError
        ? typeof error.body === 'object' &&
          error.body !== null &&
          'message' in error.body
          ? String((error.body as { message: unknown }).message)
          : error.message
        : 'Erreur inattendue';
    return { success: false, error: msg };
  }
}
