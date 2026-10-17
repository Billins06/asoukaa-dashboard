import { Badge } from '@/components/ui/badge';
import { ticketStatusMeta } from '@/lib/support/meta';

export function TicketStatusBadge({ status }: { status: string }) {
  const meta = ticketStatusMeta(status);
  return (
    <Badge variant="outline" className={`text-[11px] ${meta.badge}`}>
      {meta.label}
    </Badge>
  );
}
