import { Badge } from '@/components/ui/badge';
import type { ExpressListItem } from '@/lib/express-deliveries/types';

export function StatusBadge({ d }: { d: Pick<ExpressListItem, 'status' | 'paymentStatus' | 'refundStatus'> }) {
  const map: Record<string, { label: string; cls: string }> = {
    'en attente': { label: 'En attente', cls: 'border-slate-500/40 text-slate-500 bg-slate-500/5' },
    'contre-proposition': { label: 'Contre-proposition', cls: 'border-amber-500/40 text-amber-600 bg-amber-500/5' },
    'paiement en attente': { label: 'À payer', cls: 'border-orange-500/40 text-orange-600 bg-orange-500/5' },
    accepté: { label: 'Payée', cls: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' },
    'en cours de livraison': { label: 'En route', cls: 'border-sky-500/40 text-sky-600 bg-sky-500/5' },
    livré: { label: 'Livrée', cls: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5' },
    annulée: { label: 'Annulée', cls: 'border-destructive/40 text-destructive bg-destructive/5' },
  };
  const m = map[d.status] ?? { label: d.status, cls: '' };
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="outline" className={`text-[11px] ${m.cls}`}>
        {m.label}
      </Badge>
      {d.paymentStatus === 'à vérifier' && (
        <Badge variant="outline" className="text-[11px] border-destructive/40 text-destructive bg-destructive/5">
          Paiement à vérifier
        </Badge>
      )}
      {d.refundStatus === 'à rembourser' && (
        <Badge variant="outline" className="text-[11px] border-destructive/40 text-destructive bg-destructive/5">
          À rembourser
        </Badge>
      )}
      {d.refundStatus === 'remboursé' && (
        <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
          Remboursée
        </Badge>
      )}
    </div>
  );
}
