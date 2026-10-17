import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'rayons', label: 'Bandeau & rayons', href: '/dashboard/vitrine' },
  { key: 'best-shops', label: 'Meilleures boutiques', href: '/dashboard/vitrine/best-shops' },
] as const;

/** Sous-navigation de la section Vitrine (liens, rendu côté serveur). */
export function VitrineTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Sections de la vitrine">
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
