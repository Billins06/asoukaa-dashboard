import 'server-only';
import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import type { AdminAccount, AdminListResponse } from './types';

/**
 * Le serveur répond { data, pagination: { total, page, limit, pages } } :
 * on remet les compteurs à la racine pour que la page lise `total` / `pages`.
 */
export async function getAdmins(page = 1, limit = 20): Promise<AdminListResponse> {
  const raw = await api.get<unknown>(`/auth/admin/list?page=${page}&limit=${limit}`);
  return normalizePaginated<AdminAccount>(raw, { page, limit });
}

export async function getAdminById(id: string): Promise<AdminAccount> {
  return api.get<AdminAccount>(`/auth/admin/${encodeURIComponent(id)}`);
}
