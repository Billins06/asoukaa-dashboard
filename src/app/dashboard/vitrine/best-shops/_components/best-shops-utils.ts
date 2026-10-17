import type { BestShop } from '@/lib/vitrine/types';

/** Statut vendeur « approuvé » côté backend (VendorStatus.APPROVED). */
const VENDOR_APPROVED = 'approuvé';

/**
 * Raisons probables pour lesquelles une boutique de la liste n'apparaît pas
 * sur l'accueil (isDisplayed = false). Vide si elle s'affiche.
 */
export function notDisplayedReasons(shop: BestShop): string[] {
  if (shop.isDisplayed) return [];
  const reasons: string[] = [];
  if (!shop.isActive) reasons.push('désactivée dans cette liste');
  if (shop.vendor.status !== VENDOR_APPROVED) reasons.push(`vendeur non approuvé (${shop.vendor.status})`);
  if (!shop.vendor.accountActive) reasons.push('compte du vendeur désactivé');
  if (!shop.vendor.shopVisible) reasons.push('boutique masquée par le vendeur');
  if (shop.visibleProductCount <= 0) reasons.push('aucun produit visible');
  return reasons;
}
