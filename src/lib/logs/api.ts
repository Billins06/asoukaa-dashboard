import { api } from '@/lib/api';
import type { ActivityLog, BackendPaginated, LogFilters } from './types';

export async function getLogs(filters: LogFilters = {}): Promise<BackendPaginated<ActivityLog>> {
  const params = new URLSearchParams();
  if (filters.actorType) params.set('actorType', filters.actorType);
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.action) params.set('action', filters.action);
  if (filters.result) params.set('result', filters.result);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));

  const qs = params.toString();
  return api.get<BackendPaginated<ActivityLog>>(`/activity-logs?${qs}`);
}

export async function getLoginFailures(page = 1, limit = 20): Promise<BackendPaginated<ActivityLog>> {
  return api.get<BackendPaginated<ActivityLog>>(`/activity-logs/login-failures?page=${page}&limit=${limit}`);
}

export async function getLogStats(): Promise<Record<string, unknown>> {
  return api.get<Record<string, unknown>>('/activity-logs/stats');
}
