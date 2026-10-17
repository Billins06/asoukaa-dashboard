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
