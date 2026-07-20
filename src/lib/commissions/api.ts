import 'server-only';
import { api } from '@/lib/api';
import type { CommissionListItem, CommissionStats, CommissionStatus, BackendPaginated } from './types';

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
  return api.get<BackendPaginated<CommissionListItem>>(`/admin/commissions${qs ? `?${qs}` : ''}`);
}

export async function getCommissionStats(): Promise<CommissionStats> {
  return api.get<CommissionStats>('/admin/commissions/stats/overview');
}
