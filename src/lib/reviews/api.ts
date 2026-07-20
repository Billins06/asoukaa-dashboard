import 'server-only';
import { api } from '@/lib/api';
import type { ReviewListItem, ReviewStatus, BackendPaginated } from './types';

export async function getReviews(params?: {
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<ReviewListItem>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<BackendPaginated<ReviewListItem>>(`/reviews${qs ? `?${qs}` : ''}`);
}

export async function getPendingReviews(params?: {
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<ReviewListItem>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<BackendPaginated<ReviewListItem>>(`/reviews/pending${qs ? `?${qs}` : ''}`);
}
