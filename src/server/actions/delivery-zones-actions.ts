'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';

export async function updateDeliveryZoneAction(
  id: string,
  data: { fraisLivraison?: number; isActive?: boolean },
): Promise<ActionResult> {
  try {
    await api.patch(`/delivery-zones/${id}`, data);
    revalidatePath('/dashboard/delivery-zones');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors de la mise à jour.' };
  }
}
