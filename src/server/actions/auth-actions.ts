'use server';

import { cookies } from 'next/headers';
import { redirect, unstable_rethrow } from 'next/navigation';
import { decodeJwt } from 'jose';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { AUTH_COOKIE, DASHBOARD_ROLES } from '@/lib/constants';
import { passwordSchema } from '@/lib/password-rules';
import type { LoginResponse } from '@/types/auth';
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

/**
 * Durée du cookie = durée de vie RESTANTE du jeton (claim `exp`), plafonnée par
 * AUTH_COOKIE.maxAge (1 jour par défaut).
 *
 * Pourquoi : le JWT admin expire côté serveur (JWT_EXPIRES_IN=1d) ; un cookie plus
 * long que le jeton laisse une session « fantôme » (cookie présent, jeton mort).
 * En lisant `exp` on reste aligné même si le serveur change cette durée, sans
 * dépendre d'une variable d'environnement du dashboard. Le jeton n'est PAS vérifié
 * ici (decodeJwt ne contrôle pas la signature) : on ne s'en sert que pour la durée,
 * la vraie validation reste faite par le backend à chaque appel.
 */
function cookieMaxAgeFor(accessToken: string): number {
  try {
    const { exp } = decodeJwt(accessToken);
    if (typeof exp === 'number') {
      const remaining = exp - Math.floor(Date.now() / 1000);
      if (remaining > 0) return Math.min(AUTH_COOKIE.maxAge, remaining);
    }
  } catch {
    // jeton illisible : on retombe sur la durée par défaut ci-dessous
  }
  return AUTH_COOKIE.maxAge;
}

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
    maxAge: cookieMaxAgeFor(response.accessToken),
  });

  return { success: true, data: { redirectTo: '/dashboard' } };
}

/**
 * Déconnexion : révoque le jeton côté backend (POST /auth/logout, liste noire),
 * puis supprime le cookie et redirige vers /login.
 *
 * Pourquoi appeler le backend AVANT de supprimer le cookie : sans cela, le jeton
 * volé ou copié resterait utilisable jusqu'à son expiration (1 jour) même après
 * « Se déconnecter ». L'appel se fait avec le jeton du cookie, donc il doit
 * précéder la suppression.
 *
 * L'échec de la révocation est ignoré (serveur en panne, jeton déjà expiré…) :
 * l'admin doit pouvoir se déconnecter quoi qu'il arrive. `redirectOn401: false`
 * évite qu'un jeton déjà mort déclenche ici la redirection « session expirée ».
 */
export async function logoutAction(): Promise<void> {
  try {
    await api.post('/auth/logout', undefined, { redirectOn401: false, timeout: 5_000 });
  } catch {
    // Best effort : on déconnecte quand même côté navigateur.
  }

  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE.name);

  redirect('/login');
}

// ─────────────────────────────────────────────────────────────
// Invitation admin : définition du mot de passe (page publique /set-password)
// ─────────────────────────────────────────────────────────────

const SetPasswordSchema = z
  .object({
    // Le jeton d'invitation est un UUID généré par le serveur
    token: z.string().regex(/^[0-9a-f-]{36}$/i, "Lien d'invitation invalide"),
    email: z.string().trim().toLowerCase().email("Lien d'invitation invalide").max(254),
    // Mêmes règles que le serveur (voir lib/password-rules.ts)
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

/**
 * Définit le mot de passe d'un admin invité (POST /auth/admin/set-password).
 *
 * Particularité du serveur : l'e-mail passe en PARAMÈTRE D'URL (?email=...) alors
 * que le jeton et les mots de passe passent dans le corps JSON (invitationToken,
 * password, confirmPassword). Route publique : aucun jeton de session envoyé.
 * Les messages du serveur (« lien expiré », « déjà défini »…) sont renvoyés tels
 * quels : ils ne révèlent rien de sensible et guident l'utilisateur.
 */
export async function setAdminPasswordAction(input: {
  token: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<GenericActionResult> {
  const parsed = SetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  try {
    await api.post(
      `/auth/admin/set-password?email=${encodeURIComponent(parsed.data.email)}`,
      {
        invitationToken: parsed.data.token,
        password: parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
      },
      { auth: false },
    );
    return { success: true, data: undefined };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return { success: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' };
      }
      if (error.status === 0 || error.status === 408) {
        return { success: false, error: 'Le serveur ne répond pas. Vérifiez votre connexion ou réessayez.' };
      }
      return { success: false, error: error.message || "Impossible de définir le mot de passe." };
    }
    return { success: false, error: 'Impossible de définir le mot de passe.' };
  }
}
