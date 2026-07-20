import 'server-only';
import { api } from '@/lib/api';
import type { OrderListItem, OrderStatus, BackendPaginated } from './types';

export async function getOrders(params?: {
  status?: OrderStatus;
  vendorId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<OrderListItem>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.vendorId) query.set('vendorId', params.vendorId);
  if (params?.userId) query.set('userId', params.userId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<BackendPaginated<OrderListItem>>(`/orders${qs ? `?${qs}` : ''}`);
}
