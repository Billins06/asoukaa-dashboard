import 'server-only';
import { api } from '@/lib/api';
import type { Banner } from './types';

export async function getBanners(): Promise<Banner[]> {
  const data = await api.get<Banner[] | { data: Banner[] }>('/admin/banners');
  return Array.isArray(data) ? data : (data?.data ?? []);
}
