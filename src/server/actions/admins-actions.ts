'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import type { CreateAdminPayload } from '@/lib/admins/types';
import type { ActionResult } from '@/types/api';

export async function createAdminAction(payload: CreateAdminPayload): Promise<ActionResult<void>> {
  try {
    await api.post('/auth/admin/create', payload);
    revalidatePath('/dashboard/admins');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

export async function deactivateAdminAction(id: string): Promise<ActionResult<void>> {
  try {
    await api.post(`/auth/admin/${id}/deactivate`, {});
    revalidatePath('/dashboard/admins');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}
