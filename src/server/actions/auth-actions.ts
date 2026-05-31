'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { AUTH_COOKIE, DASHBOARD_ROLES } from '@/lib/constants';
import type { LoginResponse, ActionResult } from '@/types/auth';
import type { ActionResult as GenericActionResult } from '@/types/api';

/**
 * Server Actions pour l'authentification.
 *
 * Pourquoi des Server Actions :
 *  - Le cookie httpOnly NE PEUT être posé que côté serveur
 *  - Le token JWT ne touche jamais le JavaScript du navigateur
 *  - L'utilisateur final ne voit pas l'URL du backend depuis ses devtools
 *
 * Sécurité :
 *  - Validation stricte des entrées avec Zod
 *  - Vérification du rôle (seuls admin/superadmin peuvent se connecter ici)
 *  - Messages d'erreur génériques (pas de "email inconnu" / "mot de passe incorrect"
 *    qui révèlent quelles adresses existent)
 */

// Schéma de validation côté serveur (toujours valider même si le front a validé)
const LoginSchema = z.object({
  email: z.string().email('Email invalide').max(254),
  password: z.string().min(1, 'Mot de passe requis').max(200),
});

const GENERIC_AUTH_ERROR = 'Identifiants invalides';

export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<GenericActionResult<{ redirectTo: string }>> {
  // 1. Validation
  const parsed = LoginSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  // 2. Appel backend
  let response: LoginResponse;
  try {
    response = await api.post<LoginResponse>(
      '/auth/admin/login',
      {
        identifier: parsed.data.email,
        password: parsed.data.password,
      },
      { auth: false }, // pas besoin de token pour se connecter
    );
  } catch (error) {
    // Message générique : on ne révèle PAS si c'est l'email ou le password qui est faux
    if (error instanceof ApiError) {
      // 401/403 → identifiants
      // 429 → rate limit (à afficher tel quel)
      if (error.status === 429) {
        return {
          success: false,
          error: 'Trop de tentatives. Réessayez dans quelques minutes.',
        };
      }
      if (error.status === 0 || error.status === 408) {
        return {
          success: false,
          error: 'Le serveur ne répond pas. Vérifie ta connexion ou réessaie.',
        };
      }
      // Cas spécifique : compte invité qui n'a pas encore défini son mot de passe
      if (
        error.status === 403 &&
        typeof error.body === 'object' &&
        error.body !== null &&
        'message' in error.body &&
        typeof (error.body as { message: unknown }).message === 'string' &&
        (error.body as { message: string }).message.includes('invitation')
      ) {
        return {
          success: false,
          error:
            "Vous devez d'abord définir votre mot de passe via le lien d'invitation reçu par email.",
        };
      }
      return { success: false, error: GENERIC_AUTH_ERROR };
    }
    return { success: false, error: GENERIC_AUTH_ERROR };
  }

  // 3. Vérification du rôle — un client/vendor/livreur ne doit PAS pouvoir se connecter au dashboard
  // (sécurité défensive — le backend filtre déjà via /auth/admin/login)
  const adminRole = response.admin?.role;
  if (!adminRole || !DASHBOARD_ROLES.includes(adminRole as (typeof DASHBOARD_ROLES)[number])) {
    return {
      success: false,
      error: "Votre compte n'est pas autorisé sur ce dashboard.",
    };
  }

  // 4. Vérification du compte actif
  if (!response.admin.isActive) {
    return {
      success: false,
      error: 'Votre compte a été désactivé. Contactez le SuperAdmin.',
    };
  }

  // 5. Pose le cookie httpOnly
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE.name, response.accessToken, {
    httpOnly: true,
    // secure: true en HTTPS prod, false en dev http://localhost
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // bonne valeur par défaut pour la protection CSRF
    path: '/',
    maxAge: AUTH_COOKIE.maxAge,
  });

  return { success: true, data: { redirectTo: '/dashboard' } };
}

/**
 * Déconnexion : supprime le cookie + redirige vers /login.
 *
 * Note : on pourrait aussi appeler POST /auth/logout côté backend
 * pour invalider le refresh token (à implémenter si tu ajoutes les refresh tokens).
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE.name);

  // Optionnel : prévenir le backend pour invalider le refresh token côté serveur
  // try {
  //   await api.post('/auth/logout', undefined, { auth: true });
  // } catch {
  //   // Best effort — si le backend est down, on déconnecte quand même côté client
  // }

  redirect('/login');
}
