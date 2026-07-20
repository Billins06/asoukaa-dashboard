'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { CreateFournisseurPayload, UpdateFournisseurPayload } from '@/lib/fournisseurs/types';
import type { ActionResult } from '@/types/api';

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    const msg = (error.body as { message?: unknown } | null)?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

export async function createFournisseurAction(payload: CreateFournisseurPayload): Promise<ActionResult> {
  try {
    await api.post('/fournisseurs', payload);
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function updateFournisseurAction(id: string, payload: UpdateFournisseurPayload): Promise<ActionResult> {
  try {
    await api.put(`/fournisseurs/${id}`, payload);
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function toggleFournisseurAction(id: string): Promise<ActionResult> {
  try {
    await api.patch(`/fournisseurs/${id}/toggle`);
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function deleteFournisseurAction(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/fournisseurs/${id}`);
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}
