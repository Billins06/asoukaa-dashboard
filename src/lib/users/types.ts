export interface UserListItem {
  id: string;
  email: string;
  phone: string;
  prenom: string;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * Rôles : GET /users renvoie des objets { id, userId, role, isActive, createdAt },
   * d'autres routes (tickets de support…) renvoient un simple tableau de textes.
   * Les deux formes sont acceptées ; utiliser getRoleNames() pour les lire.
   */
  roles?: UserRoleField[] | null;
  /** Alerte « Ce n'est pas moi » (changement d'e-mail contesté) : date ISO ou null. */
  securityAlertAt?: string | null;
  /** Motif de l'alerte : texte libre, à afficher en TEXTE BRUT uniquement. */
  securityAlertReason?: string | null;
  /** Date à laquelle un admin a traité l'alerte (ISO) ou null. */
  securityAlertAckedAt?: string | null;
}

export interface UserRoleEntry {
  id?: string;
  userId?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

export type UserRoleField = UserRoleEntry | string;

/** Réponse de PATCH /users/:id/security-alert/ack */
export interface SecurityAlertAckResult {
  id: string;
  securityAlertAckedAt: string;
}

// Rôles "marketplace" qu'un admin peut assigner à la création — les rôles
// admin/superadmin passent par le module Admins dédié, pas par ici.
export type UserRoleValue = 'client' | 'vendor' | 'delivery_agent';

export interface CreateUserInput {
  prenom: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRoleValue;
}

export interface UpdateUserInput {
  prenom?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
