'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type {
  CreateRayonPayload,
  UpdateRayonPayload,
  RayonDetail,
  VitrineProduct,
  SaveBandeauPayload,
  BestShop,
  BestShopCandidatesPage,
} from '@/lib/vitrine/types';
import type { ActionResult } from '@/types/api';

const PATH = '/dashboard/vitrine';

function extractMsg(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Serveur injoignable. Vérifiez que le backend est démarré.';
    }
    const msg = (error.body as { message?: unknown } | null)?.message;
    // 404 « route inconnue » de NestJS (« Cannot PATCH /api/v1/... ») ≠ 404
    // métier (« Rayon introuvable ») qu'on affiche tel quel.
    if (error.status === 404 && (typeof msg !== 'string' || /^Cannot [A-Z]+ \//.test(msg))) {
      return "Fonction indisponible : la route n'existe pas (encore) côté serveur.";
    }
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg) return msg;
    return error.message;
  }
  return 'Erreur inattendue';
}

// ─── Rayons ────────────────────────────────────────────────

export async function createRayonAction(payload: CreateRayonPayload): Promise<ActionResult> {
  try {
    await api.post('/admin/vitrine/rayons', payload);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function updateRayonAction(
  id: string,
  payload: UpdateRayonPayload,
): Promise<ActionResult> {
  try {
    await api.patch(`/admin/vitrine/rayons/${id}`, payload);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function deleteRayonAction(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/admin/vitrine/rayons/${id}`);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

/**
 * Réordonne plusieurs rayons : un PATCH { sortOrder } par rayon modifié.
 * Séquentiel volontairement (évite de saturer le backend et garde un
 * état cohérent si l'un échoue).
 */
export async function reorderRayonsAction(
  items: { id: string; sortOrder: number }[],
): Promise<ActionResult> {
  try {
    for (const it of items) {
      await api.patch(`/admin/vitrine/rayons/${it.id}`, { sortOrder: it.sortOrder });
    }
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    revalidatePath(PATH);
    return { success: false, error: extractMsg(error) };
  }
}

export async function getRayonDetailAction(id: string): Promise<ActionResult<RayonDetail>> {
  try {
    const data = await api.get<RayonDetail>(`/admin/vitrine/rayons/${id}`);
    return {
      success: true,
      data: { ...data, products: Array.isArray(data?.products) ? data.products : [] },
    };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function setRayonProductsAction(
  id: string,
  productIds: string[],
): Promise<ActionResult> {
  try {
    await api.put(`/admin/vitrine/rayons/${id}/products`, { productIds });
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function searchVitrineProductsAction(
  search: string,
  limit = 20,
): Promise<ActionResult<VitrineProduct[]>> {
  try {
    const qs = new URLSearchParams({ search, limit: String(limit) }).toString();
    const data = await api.get<VitrineProduct[] | { data: VitrineProduct[] }>(
      `/admin/vitrine/products-search?${qs}`,
    );
    return { success: true, data: Array.isArray(data) ? data : (data?.data ?? []) };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

// ─── Bandeau « Pour vous » ─────────────────────────────────

export async function saveBandeauAction(payload: SaveBandeauPayload): Promise<ActionResult> {
  try {
    await api.put('/admin/vitrine/bandeau', payload);
    revalidatePath(PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

// ─── Meilleures boutiques ──────────────────────────────────

const BEST_SHOPS_PATH = '/dashboard/vitrine/best-shops';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVALID_ID = 'Identifiant invalide.';

export async function searchBestShopCandidatesAction(
  search: string,
  page = 1,
  limit = 8,
): Promise<ActionResult<BestShopCandidatesPage>> {
  try {
    const qs = new URLSearchParams({
      search: String(search ?? '').trim().slice(0, 100),
      page: String(Math.max(1, Math.floor(Number(page)) || 1)),
      limit: String(Math.min(50, Math.max(1, Math.floor(Number(limit)) || 8))),
    }).toString();
    const data = await api.get<BestShopCandidatesPage>(`/admin/vitrine/best-shops/candidates?${qs}`);
    return {
      success: true,
      data: {
        data: Array.isArray(data?.data) ? data.data : [],
        meta: data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 },
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function addBestShopAction(vendorId: string): Promise<ActionResult<BestShop>> {
  if (!UUID_RE.test(vendorId)) return { success: false, error: INVALID_ID };
  try {
    const row = await api.post<BestShop>('/admin/vitrine/best-shops', { vendorId });
    revalidatePath(BEST_SHOPS_PATH);
    return { success: true, data: row };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

export async function setBestShopActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  if (!UUID_RE.test(id) || typeof isActive !== 'boolean') return { success: false, error: INVALID_ID };
  try {
    await api.patch(`/admin/vitrine/best-shops/${id}`, { isActive });
    revalidatePath(BEST_SHOPS_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}

/** `ids` doit contenir TOUS les identifiants de la liste, dans le nouvel ordre. */
export async function reorderBestShopsAction(ids: string[]): Promise<ActionResult<BestShop[]>> {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((i) => typeof i !== 'string' || !UUID_RE.test(i))) {
    return { success: false, error: INVALID_ID };
  }
  try {
    const data = await api.put<BestShop[] | { data: BestShop[] }>('/admin/vitrine/best-shops/order', { ids });
    revalidatePath(BEST_SHOPS_PATH);
    const rows = Array.isArray(data) ? data : (data?.data ?? []);
    return { success: true, data: rows };
  } catch (error) {
    unstable_rethrow(error);
    revalidatePath(BEST_SHOPS_PATH);
    return { success: false, error: extractMsg(error) };
  }
}

export async function removeBestShopAction(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: INVALID_ID };
  try {
    await api.delete(`/admin/vitrine/best-shops/${id}`);
    revalidatePath(BEST_SHOPS_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: extractMsg(error) };
  }
}
