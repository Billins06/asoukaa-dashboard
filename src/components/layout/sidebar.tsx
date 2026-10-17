'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS, type NavItem } from './nav-items';
import { cn } from '@/lib/utils';
import { getSidebarCountsAction } from '@/server/actions/sidebar-actions';
import type { SidebarCounts } from '@/lib/sidebar/types';
import { SIDEBAR_REFRESH_EVENT } from '@/lib/sidebar/events';
import type { AdminRole } from '@/types/auth';

/** Délai minimal entre deux rafraîchissements (évite les rafales focus + visibilité). */
const MIN_REFRESH_INTERVAL_MS = 3_000;

/** Plafond d'affichage : au-delà de 99, la pastille indique « 99+ ». */
function formatCount(n: number): string {
  return n > 99 ? '99+' : String(n);
}

function NavBadge({ item, counts }: { item: NavItem; counts: SidebarCounts | null }) {
  // Valeur fixe éventuelle, sinon compteur de l'API. 0, absent ou erreur = pas de pastille.
  const value = item.countKey ? counts?.[item.countKey] ?? 0 : item.badge ?? 0;
  if (!Number.isFinite(value) || value <= 0) return null;

  const isAlert = item.badgeTone === 'alert';
  const label = isAlert
    ? `${value > 99 ? 'Plus de 99' : value} alerte${value > 1 ? 's' : ''} en attente`
    : `${value > 99 ? 'Plus de 99' : value} en attente`;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none tabular-nums',
        // File d'attente = couleur primaire du projet (orange) ; alerte de sécurité = rouge
        isAlert ? 'bg-red-600 text-white' : 'bg-primary text-primary-foreground',
      )}
    >
      <span aria-hidden="true">{formatCount(value)}</span>
    </span>
  );
}

interface SidebarProps {
  userRole: AdminRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<SidebarCounts | null>(null);

  // Numéro de la dernière requête : une réponse lente arrivée après une plus récente
  // (changements de page rapides) est ignorée au lieu d'écraser des chiffres à jour.
  const requestId = useRef(0);
  const lastRefreshAt = useRef(0);
  const mounted = useRef(true);

  const refreshCounts = useCallback(async () => {
    const id = ++requestId.current;
    lastRefreshAt.current = Date.now();
    try {
      const result = await getSidebarCountsAction();
      if (mounted.current && id === requestId.current) setCounts(result);
    } catch {
      // Erreur réseau / action : pas de pastille plutôt qu'un menu cassé
      if (mounted.current && id === requestId.current) setCounts(null);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // À CHAQUE changement de page (et au premier affichage) : un admin qui vient de traiter
  // une candidature voit la pastille baisser dès qu'il change de page.
  useEffect(() => {
    void refreshCounts();
  }, [pathname, refreshCounts]);

  // Au retour sur l'onglet du navigateur : de nouvelles demandes ont pu arriver entre-temps.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRefreshAt.current < MIN_REFRESH_INTERVAL_MS) return;
      void refreshCounts();
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [refreshCounts]);

  // Une page demande un rafraîchissement immédiat (ex. alerte de sécurité traitée).
  useEffect(() => {
    const onRequest = () => void refreshCounts();
    window.addEventListener(SIDEBAR_REFRESH_EVENT, onRequest);
    return () => window.removeEventListener(SIDEBAR_REFRESH_EVENT, onRequest);
  }, [refreshCounts]);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0 bg-card border-r border-border">
      {/* Brand */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-linear-to-br from-orange-500 to-primary flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
          <span className="text-white font-black text-sm select-none">A</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-tight">Asoukaa</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Administration
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.requiredRole) return true;
            if (item.requiredRole === 'superadmin') return userRole === 'superadmin';
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-5">
              <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.09em]">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href);

                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-3.75 w-3.75 shrink-0 transition-colors',
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground/70 group-hover:text-foreground',
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        <NavBadge item={item} counts={counts} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border">
        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            © {new Date().getFullYear()} Asoukaa
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">Plateforme marketplace</p>
        </div>
      </div>
    </aside>
  );
}
