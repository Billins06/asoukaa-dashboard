'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { isAdminRole } from '@/lib/status-meta';
import type { CreateAdminPayload } from '@/lib/admins/types';
import type { ActionResult } from '@/types/api';

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

export async function createAdminAction(payload: CreateAdminPayload): Promise<ActionResult<void>> {
  // Le serveur n'accepte que « admin » / « superadmin » en minuscules.
  const role = typeof payload.role === 'string' ? payload.role.toLowerCase() : payload.role;
  if (!isAdminRole(role)) {
    return { success: false, error: 'Rôle invalide.' };
  }
  try {
    await api.post('/auth/admin/create', {
      prenom: payload.prenom?.trim(),
      name: payload.name?.trim(),
      email: payload.email?.trim().toLowerCase(),
      role,
    });
    revalidatePath('/dashboard/admins');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: messageOf(error) };
  }
}

export async function deactivateAdminAction(id: string): Promise<ActionResult<void>> {
  try {
    await api.post(`/auth/admin/${encodeURIComponent(id)}/deactivate`, {});
    revalidatePath('/dashboard/admins');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: messageOf(error) };
  }
}
