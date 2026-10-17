/**
 * Types du journal d'activité — alignés sur l'entité serveur
 * `common/entities/activity-log.entity.ts` (NestJS).
 *
 * Attention : les valeurs du serveur sont en minuscules (`admin`, `success`…),
 * et les détails d'un changement sont dans `oldValue` / `newValue` /
 * `errorMessage` (il n'existe PAS de champ `description` ni `metadata`).
 */
import type { Paginated } from '@/lib/pagination';
import type { LogActorType, LogResult } from '@/lib/status-meta';

export type { LogActorType, LogResult };

export interface ActivityLog {
  id: string;
  /** null = action automatique du système. */
  actorId: string | null;
  actorType: LogActorType;
  /** Libellé français exact de l'enum serveur (« Commande annulée »…). */
  action: string;
  entityType: string | null;
  entityId: string | null;
  /** Valeur AVANT la modification (objet libre) ou null. */
  oldValue: Record<string, unknown> | null;
  /** Valeur APRÈS la modification (objet libre) ou null. */
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  result: LogResult;
  /** Message d'erreur quand `result` = failure. */
  errorMessage: string | null;
  createdAt: string;
}

export type BackendPaginated<T> = Paginated<T>;

export interface LogFilters {
  actorType?: LogActorType;
  action?: string;
  result?: LogResult;
  page?: number;
  limit?: number;
}
