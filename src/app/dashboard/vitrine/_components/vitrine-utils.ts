import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { RayonType } from '@/lib/vitrine/types';

export const RAYON_TYPE_OPTIONS: { value: RayonType; label: string; className: string }[] = [
  { value: 'flash', label: 'Ventes flash', className: 'border-red-500/40 text-red-600 bg-red-500/5' },
  { value: 'tendance', label: 'Tendances', className: 'border-violet-500/40 text-violet-600 bg-violet-500/5' },
  { value: 'succes', label: 'Ventes à succès', className: 'border-amber-500/40 text-amber-600 bg-amber-500/5' },
  { value: 'libre', label: 'Libre', className: 'border-slate-400/40 text-slate-500 bg-slate-500/5' },
];

export function rayonTypeMeta(type: RayonType) {
  return RAYON_TYPE_OPTIONS.find((o) => o.value === type) ?? RAYON_TYPE_OPTIONS[3];
}

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  brouillon: 'Brouillon',
  inactive: 'Désactivé',
  out_of_stock: 'Rupture de stock',
};

/** Libellé français d'un statut produit (repli : valeur brute). */
export function productStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Inconnu';
  return PRODUCT_STATUS_LABELS[status] ?? status;
}

/** 12500 → "12 500 FCFA" (accepte un Decimal sérialisé en string) */
export function formatFcfa(price: number | string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} FCFA`;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'd MMM yyyy HH:mm', { locale: fr });
}

export function formatPeriod(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return 'Permanent';
  if (startsAt && !endsAt) return `Dès le ${fmt(startsAt)}`;
  if (!startsAt && endsAt) return `Jusqu'au ${fmt(endsAt)}`;
  return `${fmt(startsAt!)} → ${fmt(endsAt!)}`;
}

/** Statut temporel d'un rayon par rapport à maintenant. */
export function periodStatus(startsAt: string | null, endsAt: string | null): 'programme' | 'termine' | null {
  const now = Date.now();
  if (startsAt && new Date(startsAt).getTime() > now) return 'programme';
  if (endsAt && new Date(endsAt).getTime() < now) return 'termine';
  return null;
}

/** ISO → valeur d'un <input type="datetime-local"> (heure locale). */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, "yyyy-MM-dd'T'HH:mm");
}

/** Valeur datetime-local → ISO (null si vide ou invalide). */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
