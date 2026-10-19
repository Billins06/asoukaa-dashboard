import { FolderTree, Package, Store, ExternalLink, type LucideIcon } from 'lucide-react';
import type { BannerStatus, BannerTargetType } from '@/lib/banners/types';

export const TARGET_OPTIONS: { value: BannerTargetType; label: string; icon: LucideIcon }[] = [
  { value: 'category', label: 'Catégorie', icon: FolderTree },
  { value: 'product', label: 'Produit', icon: Package },
  { value: 'shop', label: 'Boutique', icon: Store },
  { value: 'link', label: 'Lien externe', icon: ExternalLink },
];

export function targetLabel(type: BannerTargetType): string {
  return TARGET_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export const STATUS_META: Record<BannerStatus, { label: string; className: string; hint?: string }> = {
  visible: { label: 'Visible', className: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' },
  inactive: { label: 'Masquée', className: 'border-slate-400/40 text-slate-500 bg-slate-500/5' },
  programmee: { label: 'Programmée', className: 'border-sky-500/40 text-sky-600 bg-sky-500/5' },
  expiree: { label: 'Terminée', className: 'border-slate-400/40 text-slate-500 bg-slate-500/5' },
  cible_invalide: {
    label: 'Cible indisponible',
    className: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
    hint: "La catégorie, le produit ou la boutique visé n'existe plus ou n'est plus visible par les acheteurs : la bannière n'est pas affichée dans l'appli.",
  },
};
