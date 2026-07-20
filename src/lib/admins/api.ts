import { api } from '@/lib/api';
import type { AdminAccount, AdminListResponse } from './types';

export async function getAdmins(page = 1, limit = 20): Promise<AdminListResponse> {
  return api.get<AdminListResponse>(`/auth/admin/list?page=${page}&limit=${limit}`);
}

export async function getAdminById(id: string): Promise<AdminAccount> {
  return api.get<AdminAccount>(`/auth/admin/${id}`);
}
