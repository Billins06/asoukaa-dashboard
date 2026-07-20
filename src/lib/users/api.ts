import 'server-only';

import { api } from '@/lib/api';
import type { UserListItem, BackendPaginated } from './types';

export async function getUsers(
  page = 1,
  limit = 20,
): Promise<BackendPaginated<UserListItem>> {
  return api.get<BackendPaginated<UserListItem>>(
    `/users?page=${page}&limit=${limit}`,
  );
}

export async function getUserById(id: string): Promise<UserListItem> {
  return api.get<UserListItem>(`/users/${id}`);
}
