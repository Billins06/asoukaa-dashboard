import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Store,
  Truck,
  ShoppingCart,
  FolderTree,
  Wallet,
  Handshake,
  Building2,
  TicketPercent,
  MessageSquareWarning,
  Star,
  RotateCcw,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

/**
 * Configuration de la navigation principale.
 *
 * `requiredRole` :
 *  - 'admin' (par défaut) → admin + superadmin voient l'item
 *  - 'superadmin' → seul le superadmin voit l'item
 */
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredRole?: 'admin' | 'superadmin';
  /** Pastille de notification (à brancher sur l'API plus tard) */
  badge?: number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Général',
    items: [
      { label: 'Vue globale', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Utilisateurs', href: '/dashboard/users', icon: Users },
    ],
  },
  {
    title: 'Validations',
    items: [
      { label: 'Vendeurs', href: '/dashboard/vendors', icon: Store },
      { label: 'Livreurs', href: '/dashboard/agents', icon: Truck },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { label: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Catégories', href: '/dashboard/categories', icon: FolderTree },
      { label: 'Commissions', href: '/dashboard/commissions', icon: Wallet },
      { label: 'Remboursements', href: '/dashboard/refunds', icon: RotateCcw },
    ],
  },
  {
    title: 'Catalogue & promo',
    items: [
      { label: 'Partenaires', href: '/dashboard/partners', icon: Handshake },
      { label: 'Fournisseurs', href: '/dashboard/suppliers', icon: Building2 },
      { label: 'Coupons', href: '/dashboard/coupons', icon: TicketPercent },
    ],
  },
  {
    title: 'Modération',
    items: [
      { label: 'Avis', href: '/dashboard/reviews', icon: Star },
      { label: 'Messages signalés', href: '/dashboard/messages', icon: MessageSquareWarning },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: "Journal d'activité", href: '/dashboard/logs', icon: ScrollText },
      {
        label: 'Admins',
        href: '/dashboard/admins',
        icon: ShieldCheck,
        requiredRole: 'superadmin',
      },
    ],
  },
];
