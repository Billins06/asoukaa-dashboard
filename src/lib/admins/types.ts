export type AdminRole = 'ADMIN' | 'SUPERADMIN';

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
  createdBy?: { id: string; prenom: string; name: string } | null;
}

export interface AdminListResponse {
  data: AdminAccount[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateAdminPayload {
  prenom: string;
  name: string;
  email: string;
  role: AdminRole;
}
