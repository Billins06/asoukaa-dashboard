'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { AdminProductDetail } from '@/lib/products/types';
import type { ActionResult } from '@/types/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductDetailAction(
  id: string,
): Promise<ActionResult<AdminProductDetail>> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Produit invalide' };
  try {
    const data = await api.get<AdminProductDetail>(`/admin/products/${id}`);
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function setProductBlockedAction(
  id: string,
  blocked: boolean,
  reason?: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: 'Produit invalide' };
  try {
    await api.patch(`/admin/products/${id}/block`, { blocked, reason });
    revalidatePath('/dashboard/products');
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
