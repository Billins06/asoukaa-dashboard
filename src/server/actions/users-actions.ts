'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';

export async function blockUserAction(userId: string): Promise<ActionResult> {
  try {
    await api.patch(`/users/${userId}/block`);
    revalidatePath('/dashboard/users');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du blocage.' };
  }
}

export async function unblockUserAction(userId: string): Promise<ActionResult> {
  try {
    await api.patch(`/users/${userId}/unblock`);
    revalidatePath('/dashboard/users');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du déblocage.' };
  }
}
