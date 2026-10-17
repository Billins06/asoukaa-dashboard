import 'server-only';
import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import type { PaymentToReviewItem, BackendPaginated } from './types';

/** Paiements reçus mais dont la commande n'a pas pu être validée (GET /payments?toReview=true). */
export async function getPaymentsToReview(params?: {
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<PaymentToReviewItem>> {
  const query = new URLSearchParams({ toReview: 'true' });
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const raw = await api.get<unknown>(`/payments?${query.toString()}`);
  return normalizePaginated<PaymentToReviewItem>(raw, { page: params?.page, limit: params?.limit });
}
