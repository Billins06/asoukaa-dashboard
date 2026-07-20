import 'server-only';

import { api } from '@/lib/api';
import type { VendorListItem, VendorPendingItem, VendorStatus, BackendPaginated } from './types';

export async function getVendors(
  status?: VendorStatus,
  page = 1,
  limit = 20,
): Promise<BackendPaginated<VendorListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set('status', status);
  return api.get<BackendPaginated<VendorListItem>>(`/vendors?${params}`);
}

export async function getPendingVendors(): Promise<VendorPendingItem[]> {
  return api.get<VendorPendingItem[]>('/vendors/pending');
}

export async function getVendorById(id: string): Promise<VendorListItem> {
  return api.get<VendorListItem>(`/vendors/${id}`);
}
