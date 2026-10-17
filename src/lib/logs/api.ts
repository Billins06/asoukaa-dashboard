import 'server-only';
import { api } from '@/lib/api';
import { normalizePaginated } from '@/lib/pagination';
import type { ActivityLog, BackendPaginated, LogFilters } from './types';

/**
 * Liste du journal. Le serveur valide `actorType`, `result` et `action`
 * comme des listes fermées : une valeur inconnue = erreur 400. Les valeurs
 * sont donc contrôlées par la page avant d'arriver ici.
 */
export async function getLogs(filters: LogFilters = {}): Promise<BackendPaginated<ActivityLog>> {
  const params = new URLSearchParams();
  if (filters.actorType) params.set('actorType', filters.actorType);
  if (filters.action) params.set('action', filters.action);
  if (filters.result) params.set('result', filters.result);
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  params.set('page', String(page));
  params.set('limit', String(limit));

  const raw = await api.get<unknown>(`/activity-logs?${params.toString()}`);
  return normalizePaginated<ActivityLog>(raw, { page, limit });
}

/** Échecs de connexion (utilisateurs + administrateurs). */
export async function getLoginFailures(page = 1, limit = 20): Promise<BackendPaginated<ActivityLog>> {
  const raw = await api.get<unknown>(`/activity-logs/login-failures?page=${page}&limit=${limit}`);
  return normalizePaginated<ActivityLog>(raw, { page, limit });
}
