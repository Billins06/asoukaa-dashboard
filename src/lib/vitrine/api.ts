import 'server-only';
import { api } from '@/lib/api';
import type { Bandeau, BestShop, Rayon } from './types';

export async function getRayons(): Promise<Rayon[]> {
  const data = await api.get<Rayon[] | { data: Rayon[] }>('/admin/vitrine/rayons');
  return Array.isArray(data) ? data : (data?.data ?? []);
}

/**
 * Le backend renvoie le JSON `null` quand aucun bandeau n'existe encore.
 * (Un corps vide — chaîne '' — est aussi toléré par prudence.)
 */
export async function getBandeau(): Promise<Bandeau | null> {
  const data = await api.get<Bandeau | null | ''>('/admin/vitrine/bandeau');
  return data && typeof data === 'object' ? data : null;
}

/** Liste ordonnée des « Meilleures boutiques » (admin). */
export async function getBestShops(): Promise<BestShop[]> {
  const data = await api.get<BestShop[] | { data: BestShop[] }>('/admin/vitrine/best-shops');
  return Array.isArray(data) ? data : (data?.data ?? []);
}
