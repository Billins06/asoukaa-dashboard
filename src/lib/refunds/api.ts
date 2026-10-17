import 'server-only';
import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import type { RefundListItem, RefundStatus, BackendPaginated } from './types';

export async function getRefunds(params?: {
  status?: RefundStatus;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<RefundListItem>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const raw = await api.get<unknown>(`/payments/refunds${qs ? `?${qs}` : ''}`);
  return normalizePaginated<RefundListItem>(raw, { page: params?.page, limit: params?.limit });
}
