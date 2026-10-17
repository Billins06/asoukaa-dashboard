'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ActionResult } from '@/types/api';
import type {
  CreateUserInput,
  SecurityAlertAckResult,
  UpdateUserInput,
  UserListItem,
} from '@/lib/users/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function blockUserAction(userId: string): Promise<ActionResult> {
  try {
    await api.patch(`/users/${userId}/block`);
    revalidatePath('/dashboard/users');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
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
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erreur lors du déblocage.' };
  }
}

export async function createUserAction(input: CreateUserInput): Promise<ActionResult<UserListItem>> {
  try {
    const data = await api.post<UserListItem>('/users', input);
    revalidatePath('/dashboard/users');
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la création de l'utilisateur." };
  }
}

export async function updateUserAction(
  userId: string,
  input: UpdateUserInput,
): Promise<ActionResult<UserListItem>> {
  try {
    const data = await api.patch<UserListItem>(`/users/${userId}`, input);
    revalidatePath('/dashboard/users');
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la modification de l'utilisateur." };
  }
}

/**
 * Marque l'alerte de sécurité d'un compte comme « traitée »
 * (PATCH /users/:id/security-alert/ack — admin / superadmin).
 */
export async function ackSecurityAlertAction(
  userId: string,
): Promise<ActionResult<SecurityAlertAckResult>> {
  if (typeof userId !== 'string' || !UUID_RE.test(userId)) {
    return { success: false, error: 'Identifiant utilisateur invalide.' };
  }
  try {
    const data = await api.patch<SecurityAlertAckResult>(`/users/${userId}/security-alert/ack`);
    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors du traitement de l'alerte de sécurité." };
  }
}
