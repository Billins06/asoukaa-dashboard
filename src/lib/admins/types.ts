import type { AdminRole } from '@/lib/status-meta';
import type { Paginated } from '@/lib/pagination';

/** Rôle serveur en MINUSCULES : « admin » · « superadmin » (enum AdminRole, voir lib/status-meta.ts). */
export type { AdminRole };

export interface AdminAccount {
  id: string;
  prenom: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  isPasswordSet: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /** Non fourni par la liste actuelle du serveur (relation non chargée) : toujours optionnel. */
  createdBy?: { id: string; prenom: string; name: string } | null;
}

/** Forme normalisée { data, total, page, limit, pages } (le serveur répond { data, pagination }). */
export type AdminListResponse = Paginated<AdminAccount>;

export interface CreateAdminPayload {
  prenom: string;
  name: string;
  email: string;
  role: AdminRole;
}
