import 'server-only';

import { api } from '@/lib/api';
import type { ReportedConversation, ReportedConversationsPage } from './types';

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET /chat/reported → { data, total, page, limit, pages }.
 * Accepte aussi un simple tableau (ancienne forme) pour ne pas planter la page.
 */
export async function getReportedConversations(
  page = 1,
  limit = 20,
): Promise<ReportedConversationsPage> {
  const raw = await api.get<unknown>(`/chat/reported?page=${page}&limit=${limit}`);
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const list = Array.isArray(raw) ? raw : Array.isArray(root.data) ? root.data : [];
  const data = list as ReportedConversation[];
  const total = toNumber(root.total, data.length);
  const resolvedLimit = toNumber(root.limit, limit) || limit;
  return {
    data,
    total,
    page: toNumber(root.page, page),
    limit: resolvedLimit,
    pages: toNumber(root.pages, Math.max(1, Math.ceil(total / resolvedLimit))),
  };
}
