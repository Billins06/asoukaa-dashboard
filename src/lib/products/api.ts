import 'server-only';
import { api } from '@/lib/api';
import type { AdminProductsPage } from './types';

export async function getAdminProducts(params: {
  search?: string;
  status?: string;
  isDigital?: boolean;
  blocked?: boolean;
  page?: number;
  limit?: number;
}): Promise<AdminProductsPage> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.isDigital !== undefined) query.set('isDigital', String(params.isDigital));
  if (params.blocked !== undefined) query.set('blocked', String(params.blocked));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<AdminProductsPage>(`/admin/products${qs ? `?${qs}` : ''}`);
}
