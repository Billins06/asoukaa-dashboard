import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'all', label: 'Toutes les commandes', href: '/dashboard/orders' },
  { key: 'late', label: 'Commandes à confirmer', href: '/dashboard/orders/late-confirmation' },
] as const;

/** Sous-navigation de la section Commandes (liens, rendu côté serveur). */
export function OrdersTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Sections des commandes">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? 'page' : undefined}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
            tab.key === active
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
