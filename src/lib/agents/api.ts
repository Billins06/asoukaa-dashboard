import 'server-only';

import { api } from '@/lib/api';
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
  return api.get<BackendPaginated<AgentListItem>>(`/delivery-agents?${params}`);
}

export async function getPendingAgents(): Promise<AgentPendingItem[]> {
  return api.get<AgentPendingItem[]>('/delivery-agents/pending');
}

export async function getAgentById(id: string): Promise<AgentListItem> {
  return api.get<AgentListItem>(`/delivery-agents/${id}`);
}
