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
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto rounded-full bg-primary/15 text-primary text-[10px] font-bold tabular-nums px-1.5 py-0.5 leading-none">
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
