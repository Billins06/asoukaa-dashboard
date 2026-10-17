import 'server-only';

import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import type { AgentListItem, AgentPendingItem, AgentStatus, BackendPaginated } from './types';

export async function getAgents(
  status?: AgentStatus,
  page = 1,
  limit = 20,
): Promise<BackendPaginated<AgentListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set('status', status);
  const raw = await api.get<unknown>(`/delivery-agents?${params}`);
  return normalizePaginated<AgentListItem>(raw, { page, limit });
}

/** Le serveur renvoie un tableau simple ; on accepte aussi { data: [...] } par prudence. */
export async function getPendingAgents(): Promise<AgentPendingItem[]> {
  const raw = await api.get<unknown>('/delivery-agents/pending');
  if (Array.isArray(raw)) return raw as AgentPendingItem[];
  const data = (raw as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as AgentPendingItem[]) : [];
}

export async function getAgentById(id: string): Promise<AgentListItem> {
  return api.get<AgentListItem>(`/delivery-agents/${encodeURIComponent(id)}`);
}
