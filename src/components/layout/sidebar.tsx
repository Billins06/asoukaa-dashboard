'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS } from './nav-items';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/types/auth';

interface SidebarProps {
  userRole: AdminRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-card flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm shadow-primary/20">
          A
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">Asoukaa</span>
          <span className="text-xs text-muted-foreground leading-tight">Administration</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {NAV_SECTIONS.map((section) => {
          // Filtre les items selon le rôle
          const visibleItems = section.items.filter((item) => {
            if (!item.requiredRole) return true;
            if (item.requiredRole === 'superadmin') return userRole === 'superadmin';
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  // Active si on est sur l'item OU une sous-route, sauf pour /dashboard qui matche exact
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
                          'group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto rounded-full bg-primary/15 text-primary text-xs font-medium px-2 py-0.5">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
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
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Asoukaa</p>
      </div>
    </aside>
  );
}
