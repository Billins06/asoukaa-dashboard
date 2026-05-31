'use client';

import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook léger pour récupérer l'utilisateur dans un Client Component.
 *
 * ⚠️ Ne fonctionne QUE si le store a été hydraté (cf. AuthHydrator dans
 * le layout). Pour la plupart des cas, préférer passer le user en props
 * depuis le Server Component parent (plus simple, plus sûr).
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  return { user, isAuthenticated: !!user };
}
