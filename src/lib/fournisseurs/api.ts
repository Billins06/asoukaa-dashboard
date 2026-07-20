import 'server-only';
import { api } from '@/lib/api';
import type { FournisseurListItem, BackendPaginated } from './types';

export async function getFournisseurs(params?: {
  search?: string;
  country?: string;
  ville?: string;
  currency?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<FournisseurListItem>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.country) query.set('country', params.country);
  if (params?.ville) query.set('ville', params.ville);
  if (params?.currency) query.set('currency', params.currency);
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<BackendPaginated<FournisseurListItem>>(`/fournisseurs${qs ? `?${qs}` : ''}`);
}
