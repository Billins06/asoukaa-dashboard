'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Banner, BannerPayload, TargetOption } from '@/lib/banners/types';
import type { ActionResult } from '@/types/api';

const PATH = '/dashboard/banners';

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Serveur injoignable. Vérifiez que le backend est démarré.';
    }
    const msg = (error.body as { message?: unknown } | null)?.message;
    // 404 « route inconnue » de NestJS ≠ 404 métier (« Bannière introuvable »).
    if (error.status === 404 && (typeof msg !== 'string' || /^Cannot [A-Z]+ \//.test(msg))) {
      return "Fonction indisponible : la route n'existe pas (encore) côté serveur.";
    }
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg) return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

export async function createBannerAction(payload: BannerPayload): Promise<ActionResult> {
  try {
    await api.post('/admin/banners', payload);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function updateBannerAction(
  id: string,
  payload: Partial<BannerPayload>,
): Promise<ActionResult> {
  try {
    await api.patch(`/admin/banners/${id}`, payload);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function deleteBannerAction(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/admin/banners/${id}`);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

/** Nouvel ordre : ids de TOUTES les bannières dans l'ordre voulu. */
export async function reorderBannersAction(ids: string[]): Promise<ActionResult> {
  try {
    await api.put<Banner[]>('/admin/banners/order', { ids });
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    revalidatePath(PATH);
    return { success: false, error: extractMsg(error) };
  }
}

/** Sélecteur de cible du formulaire (catégories, produits, boutiques). */
export async function lookupBannerTargetsAction(
  type: 'category' | 'product' | 'shop',
  search: string,
): Promise<ActionResult<TargetOption[]>> {
  try {
    const qs = new URLSearchParams({ type, limit: '20' });
    if (search) qs.set('search', search);
    const data = await api.get<TargetOption[] | { data: TargetOption[] }>(
      `/admin/banners/lookup?${qs.toString()}`,
    );
    return { success: true, data: Array.isArray(data) ? data : (data?.data ?? []) };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
