/**
 * Formatage commun du site admin (montants, nombres, pagination d'URL).
 *
 * POURQUOI ce fichier : `Intl.NumberFormat('fr-FR', { currency: 'XOF' })`
 * écrit « F CFA » alors que toute l'interface (et les clients) écrit « FCFA ».
 * Un seul endroit = une seule écriture partout.
 */

const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nombreCompact = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/**
 * Le serveur renvoie les décimaux Postgres sous forme de TEXTE ("12500.00").
 * On convertit sans jamais produire NaN : valeur absente ou illisible → 0.
 */
export function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 1234567 → « 1 234 567 FCFA » (espace insécable avant FCFA : jamais coupé en fin de ligne). */
export function formatFCFA(amount: unknown): string {
  return `${nombre.format(toNumber(amount))} FCFA`;
}

/** Version compacte pour les cartes : 1 234 567 → « 1,23 M FCFA », 25 000 → « 25 k FCFA ». */
export function formatFCFACompact(amount: unknown): string {
  const n = toNumber(amount);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${nombreCompact.format(n / 1_000_000)} M FCFA`;
  if (abs >= 10_000) return `${nombre.format(n / 1_000)} k FCFA`;
  return formatFCFA(n);
}

/** 1234 → « 1 234 » */
export function formatNumber(value: unknown): string {
  return nombre.format(toNumber(value));
}

/**
 * Numéro de page lu dans l'URL : « abc », « -3 », « 2.5 », vide → 1 (jamais NaN).
 * Plafonné pour éviter un `skip` démesuré côté serveur.
 */
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Math.max(1, parseInt(value ?? '', 10) || 1);
  return Math.min(n, 100_000);
}
