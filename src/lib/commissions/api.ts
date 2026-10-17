import 'server-only';
import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import { toNumber } from '@/lib/format';
import type {
  CommissionCounter,
  CommissionListItem,
  CommissionStats,
  CommissionStatus,
  BackendPaginated,
} from './types';

/**
 * Le serveur répond { data, pagination: { total, page, limit, pages } } pour les
 * commissions : normalisé ici en { data, total, page, limit, pages } comme les autres listes.
 */
export async function getCommissions(params?: {
  status?: CommissionStatus;
  vendorId?: string;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<CommissionListItem>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.vendorId) query.set('vendorId', params.vendorId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const raw = await api.get<unknown>(`/admin/commissions${qs ? `?${qs}` : ''}`);
  return normalizePaginated<CommissionListItem>(raw, { page: params?.page, limit: params?.limit });
}

function counter(raw: unknown): CommissionCounter {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return { count: toNumber(o.count), amount: toNumber(o.amount) };
}

/** Réponse serveur : { pending: {count, amount}, paid: {...}, total: {...} }. */
export async function getCommissionStats(): Promise<CommissionStats> {
  const raw = await api.get<Record<string, unknown> | null>('/admin/commissions/stats/overview');
  return {
    pending: counter(raw?.pending),
    paid: counter(raw?.paid),
    total: counter(raw?.total),
  };
}
