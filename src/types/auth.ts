/**
 * Types liés à l'authentification.
 *
 * À aligner avec ce que le backend NestJS renvoie réellement.
 * Si tu as une API doc Swagger/OpenAPI, on pourra générer ces types
 * automatiquement plus tard (openapi-typescript).
 */

export type AdminRole = 'admin' | 'superadmin';

export interface AdminUser {
  id: string;
  email: string;
  prenom: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  isPasswordSet: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdById?: string | null;
}

/**
 * Réponse de POST /auth/admin/login (backend NestJS).
 *
 * ⚠️ Le backend renvoie la clé `admin` (et non `user`) car le flux admin
 * est séparé du flux client. Conserver cette convention dans tout le dashboard.
 */
export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Erreur API standard renvoyée par le backend NestJS.
 * Format conforme à HttpException de NestJS.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
