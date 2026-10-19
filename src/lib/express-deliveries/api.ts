import 'server-only';
import { api } from '@/lib/api';
import type { ExpressPage } from './types';

export async function getExpressDeliveries(params: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  refundStatus?: string;
  attention?: boolean;
  page?: number;
  limit?: number;
}): Promise<ExpressPage> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
  if (params.refundStatus) query.set('refundStatus', params.refundStatus);
  if (params.attention) query.set('attention', 'true');
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<ExpressPage>(`/admin/independent-deliveries${qs ? `?${qs}` : ''}`);
}
