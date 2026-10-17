import 'server-only';
import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import type {
  OrderListItem,
  OrderStatus,
  BackendPaginated,
  LateConfirmationLevel,
  LateConfirmationOrder,
  LateConfirmationResponse,
} from './types';

export async function getOrders(params?: {
  status?: OrderStatus;
  vendorId?: string;
  userId?: string;
  /** true = seulement les commandes dont le client a ouvert un litige. */
  disputeOuverte?: boolean;
  page?: number;
  limit?: number;
}): Promise<BackendPaginated<OrderListItem>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.vendorId) query.set('vendorId', params.vendorId);
  if (params?.userId) query.set('userId', params.userId);
  if (params?.disputeOuverte) query.set('disputeOuverte', 'true');
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const raw = await api.get<unknown>(`/orders${qs ? `?${qs}` : ''}`);
  return normalizePaginated<OrderListItem>(raw, { page: params?.page, limit: params?.limit });
}

/** Commandes payées que le vendeur n'a pas confirmées dans le délai. */
export async function getLateConfirmationOrders(params?: {
  level?: LateConfirmationLevel;
  vendorId?: string;
  page?: number;
  limit?: number;
}): Promise<LateConfirmationResponse> {
  const query = new URLSearchParams();
  if (params?.level) query.set('level', params.level);
  if (params?.vendorId) query.set('vendorId', params.vendorId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const raw = await api.get<Record<string, unknown>>(
    `/admin/orders/late-confirmation${qs ? `?${qs}` : ''}`,
  );
  const thresholds = (raw?.thresholds ?? {}) as Partial<LateConfirmationResponse['thresholds']>;
  return {
    ...normalizePaginated<LateConfirmationOrder>(raw, { page: params?.page, limit: params?.limit }),
    thresholds: {
      reminderHours: Number(thresholds.reminderHours) || 24,
      adminAlertHours: Number(thresholds.adminAlertHours) || 48,
    },
  };
}
