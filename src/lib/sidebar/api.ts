import 'server-only';

import { api } from '@/lib/api';
import { SIDEBAR_COUNT_KEYS, type SidebarCounts } from './types';

/**
 * Récupère les compteurs des pastilles du menu (GET /admin/sidebar-counts).
 *
 * Réponse normalisée : chaque compteur est un entier >= 0. Une valeur absente,
 * négative ou non numérique devient 0 (= pas de pastille) plutôt que de faire
 * planter le menu : les pastilles sont un confort, jamais un point de blocage.
 *
 * Les erreurs sont volontairement PROPAGÉES (l'appelant décide) — notamment la
 * redirection « session expirée » de lib/api.ts, qui ne doit pas être avalée.
 */
export async function getSidebarCounts(): Promise<SidebarCounts> {
  const raw = await api.get<Record<string, unknown> | null>('/admin/sidebar-counts');

  const counts = {} as SidebarCounts;
  for (const key of SIDEBAR_COUNT_KEYS) {
    const n = Number(raw && typeof raw === 'object' ? raw[key] : 0);
    counts[key] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  return counts;
}
