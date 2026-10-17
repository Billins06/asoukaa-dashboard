/**
 * Pagination normalisée pour les pages admin.
 *
 * POURQUOI : le serveur n'a pas une seule forme de réponse paginée.
 *  - commandes, avis, remboursements, livreurs, logs :
 *      { data, total, page, limit, pages }
 *  - commissions et administrateurs :
 *      { data, pagination: { total, page, limit, pages } }
 * Et selon la route, `page`/`limit` reviennent parfois en TEXTE (valeur brute
 * de la requête). Toutes les pages lisent donc la forme unique ci-dessous.
 */

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizePaginated<T>(
  raw: unknown,
  fallback: { page?: number; limit?: number } = {},
): Paginated<T> {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  // Les compteurs sont soit à la racine, soit dans `pagination`.
  const meta = (
    root.pagination && typeof root.pagination === 'object' ? root.pagination : root
  ) as Record<string, unknown>;

  const data = Array.isArray(root.data) ? (root.data as T[]) : [];
  const total = num(meta.total, data.length);
  const limit = Math.max(1, num(meta.limit, fallback.limit ?? 20));
  const page = Math.max(1, num(meta.page, fallback.page ?? 1));
  const pages = num(meta.pages, Math.ceil(total / limit));

  return { data, total, page, limit, pages };
}
