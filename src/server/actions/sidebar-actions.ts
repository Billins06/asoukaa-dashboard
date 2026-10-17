'use server';

import { unstable_rethrow } from 'next/navigation';
import { getSidebarCounts } from '@/lib/sidebar/api';
import type { SidebarCounts } from '@/lib/sidebar/types';

/**
 * Compteurs des pastilles du menu, appelés par le composant client Sidebar à chaque
 * changement de page et au retour sur l'onglet.
 *
 * Renvoie `null` en cas d'échec (route absente côté serveur, serveur injoignable,
 * droits insuffisants…) : le menu n'affiche alors simplement aucune pastille.
 * `unstable_rethrow` laisse passer la redirection « session expirée » de lib/api.ts.
 */
export async function getSidebarCountsAction(): Promise<SidebarCounts | null> {
  try {
    return await getSidebarCounts();
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
