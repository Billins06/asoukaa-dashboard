'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarDays, ChevronDown, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PERIOD_LABELS, type DashboardPeriod } from '@/lib/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'year'];

export function PeriodSelector({ current }: { current: DashboardPeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectPeriod(period: DashboardPeriod) {
    if (period === current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 px-3 font-medium text-[13px] bg-card border-border/80 hover:bg-accent/60"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>{PERIOD_LABELS[current]}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {PERIODS.map((period) => (
          <DropdownMenuItem
            key={period}
            onSelect={() => selectPeriod(period)}
            className={cn(
              'flex items-center gap-2 cursor-pointer text-[13px]',
              period === current && 'text-primary font-medium',
            )}
          >
            <Check
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                period === current ? 'opacity-100 text-primary' : 'opacity-0',
              )}
            />
            {PERIOD_LABELS[period]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
