'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';
import type { VendorReviewAction } from '@/lib/vendors/types';

export async function reviewVendorAction(
  vendorId: string,
  action: VendorReviewAction,
  rejectionReason?: string,
): Promise<ActionResult> {
  try {
    await api.patch(`/vendors/${vendorId}/review`, { action, rejectionReason });
    revalidatePath('/dashboard/vendors');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors de la validation.' };
  }
}

export async function blockVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    await api.patch(`/vendors/${vendorId}/block`);
    revalidatePath('/dashboard/vendors');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du blocage.' };
  }
}

export async function unblockVendorAction(vendorId: string): Promise<ActionResult> {
  try {
    await api.patch(`/vendors/${vendorId}/unblock`);
    revalidatePath('/dashboard/vendors');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du déblocage.' };
  }
}

/** Commission d'un vendeur : pourcentage, montant fixe par commande, ou défaut (10 %). */
export async function setVendorCommissionAction(
  vendorId: string,
  type: 'percent' | 'fixed' | 'default',
  value?: number,
): Promise<ActionResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId)) {
    return { success: false, error: 'Vendeur invalide' };
  }
  if (type !== 'default' && (value === undefined || !Number.isFinite(value) || value < 0)) {
    return { success: false, error: 'Indiquez une valeur positive.' };
  }
  try {
    await api.patch(`/vendors/${vendorId}/commission`, type === 'default' ? { type } : { type, value });
    revalidatePath('/dashboard/vendors');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (typeof error.body === 'object' && error.body !== null && 'message' in error.body) {
        const msg = (error.body as { message: unknown }).message;
        if (Array.isArray(msg)) return { success: false, error: msg.join(', ') };
        if (typeof msg === 'string') return { success: false, error: msg };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors de la mise à jour de la commission.' };
  }
}
