import 'server-only';
import { api } from '@/lib/api';
import type { CouponListItem, BackendPaginated } from './types';

export async function getCoupons(params?: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<CouponListItem>> {
  const query = new URLSearchParams();
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<BackendPaginated<CouponListItem>>(`/coupons${qs ? `?${qs}` : ''}`);
}
