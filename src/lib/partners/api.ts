import 'server-only';
import { api } from '@/lib/api';
import type { PartnerListItem, BackendPaginated } from './types';

export async function getPartners(params?: {
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<PartnerListItem>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<BackendPaginated<PartnerListItem>>(`/partners${qs ? `?${qs}` : ''}`);
}
