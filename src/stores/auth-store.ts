'use client';

import { create } from 'zustand';
import type { AdminUser } from '@/types/auth';

/**
 * Store Zustand pour l'état utilisateur côté client.
 *
 * ⚠️ Important : ce store ne stocke PAS le token JWT.
 * Le token reste dans le cookie httpOnly. On stocke seulement les
 * infos publiques de l'utilisateur (nom, email, rôle) pour l'affichage.
 *
 * Ce store est hydraté au mount du dashboard layout depuis getCurrentUser().
 */

interface AuthState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
