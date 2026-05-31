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
  lastLoginAt?: string | null;
  createdAt: string;
}

/**
 * Réponse attendue de POST /auth/login (backend NestJS).
 *
 * ⚠️ Adapter selon ce que ton backend renvoie réellement.
 * Si la forme est différente, modifier `loginAction` dans server/actions/auth-actions.ts.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AdminUser;
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
