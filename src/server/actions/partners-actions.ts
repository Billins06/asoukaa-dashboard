'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { CreatePartnerPayload, UpdatePartnerPayload } from '@/lib/partners/types';
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

export async function createPartnerAction(payload: CreatePartnerPayload): Promise<ActionResult> {
  try {
    await api.post('/partners', payload);
    revalidatePath('/dashboard/partners');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function updatePartnerAction(id: string, payload: UpdatePartnerPayload): Promise<ActionResult> {
  try {
    await api.put(`/partners/${id}`, payload);
    revalidatePath('/dashboard/partners');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function togglePartnerAction(id: string): Promise<ActionResult> {
  try {
    await api.patch(`/partners/${id}/toggle`);
    revalidatePath('/dashboard/partners');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}

export async function deletePartnerAction(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/partners/${id}`);
    revalidatePath('/dashboard/partners');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: extractMsg(error) };
  }
}
