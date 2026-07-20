export type LogActorType = 'ADMIN' | 'USER' | 'SYSTEM';
export type LogResult = 'SUCCESS' | 'FAILURE' | 'ERROR';

export interface ActivityLog {
  id: string;
  actorId: string | null;
  actorType: LogActorType;
  action: string;
  result: LogResult;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LogFilters {
  actorType?: LogActorType;
  actorId?: string;
  action?: string;
  result?: LogResult;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
