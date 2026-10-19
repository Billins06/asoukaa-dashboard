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
  CircleAlert,
  MapPin,
  ScrollText,
  ShieldCheck,
  GalleryHorizontalEnd,
  Images,
  LifeBuoy,
  Package,
  Zap,
} from 'lucide-react';
import type { SidebarCountKey } from '@/lib/sidebar/types';

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
  /** Pastille fixe (rarement utile : préférer `countKey`, alimenté par l'API) */
  badge?: number;
  /** Compteur de /admin/sidebar-counts affiché en pastille (0 ou erreur = aucune pastille) */
  countKey?: SidebarCountKey;
  /**
   * Couleur de la pastille : 'queue' = file d'attente à traiter (couleur primaire,
   * orange) ; 'alert' = alerte de sécurité (rouge).
   */
  badgeTone?: 'queue' | 'alert';
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
      { label: 'Utilisateurs', href: '/dashboard/users', icon: Users, countKey: 'securityAlerts', badgeTone: 'alert' },
    ],
  },
  {
    title: 'Validations',
    items: [
      { label: 'Vendeurs', href: '/dashboard/vendors', icon: Store, countKey: 'vendors' },
      { label: 'Livreurs', href: '/dashboard/agents', icon: Truck, countKey: 'agents' },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { label: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart, countKey: 'ordersToConfirm' },
      { label: 'Catégories', href: '/dashboard/categories', icon: FolderTree },
      { label: 'Commissions', href: '/dashboard/commissions', icon: Wallet },
      { label: 'Remboursements', href: '/dashboard/refunds', icon: RotateCcw, countKey: 'refunds' },
      {
        label: 'Paiements à examiner',
        href: '/dashboard/payments-to-review',
        icon: CircleAlert,
        countKey: 'paymentsToReview',
        badgeTone: 'alert',
      },
      { label: 'Livraison', href: '/dashboard/delivery-zones', icon: MapPin },
      { label: 'Courses express', href: '/dashboard/express-deliveries', icon: Zap },
    ],
  },
  {
    title: 'Catalogue & promo',
    items: [
      { label: 'Produits', href: '/dashboard/products', icon: Package },
      { label: 'Partenaires', href: '/dashboard/partners', icon: Handshake },
      { label: 'Fournisseurs', href: '/dashboard/suppliers', icon: Building2 },
      { label: 'Coupons', href: '/dashboard/coupons', icon: TicketPercent },
      { label: 'Vitrine', href: '/dashboard/vitrine', icon: GalleryHorizontalEnd },
      { label: 'Bannières', href: '/dashboard/banners', icon: Images },
    ],
  },
  {
    title: 'Modération',
    items: [
      { label: 'Avis', href: '/dashboard/reviews', icon: Star },
      { label: 'Messages signalés', href: '/dashboard/messages', icon: MessageSquareWarning },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy, countKey: 'supportTickets' },
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
