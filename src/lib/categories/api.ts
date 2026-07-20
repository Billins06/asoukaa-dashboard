import 'server-only';
import { api } from '@/lib/api';
import type { CategoryNode, CategoryFlat } from './types';

export async function getCategoriesTree(includeInactive = true): Promise<CategoryNode[]> {
  const qs = includeInactive ? '?all=true' : '';
  return api.get<CategoryNode[]>(`/categories/tree${qs}`);
}

export async function getCategoriesFlat(): Promise<CategoryFlat[]> {
  return api.get<CategoryFlat[]>('/categories/flat?all=true');
}
