'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '@/lib/categories/types';
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

export async function createCategoryAction(
  payload: CreateCategoryPayload,
): Promise<ActionResult> {
  try {
    await api.post('/categories', payload);
    revalidatePath('/dashboard/categories');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function updateCategoryAction(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ActionResult> {
  try {
    await api.put(`/categories/${id}`, payload);
    revalidatePath('/dashboard/categories');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function toggleCategoryAction(id: string): Promise<ActionResult> {
  try {
    await api.patch(`/categories/${id}/toggle`);
    revalidatePath('/dashboard/categories');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/categories/${id}`);
    revalidatePath('/dashboard/categories');
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
