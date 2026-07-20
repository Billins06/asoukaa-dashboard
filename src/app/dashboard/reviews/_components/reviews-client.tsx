'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Star } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { moderateReviewAction } from '@/server/actions/reviews-actions';
import type { ReviewListItem, ReviewStatus, BackendPaginated } from '@/lib/reviews/types';

interface ReviewsClientProps {
  data: BackendPaginated<ReviewListItem>;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvés' },
  { value: 'REJECTED', label: 'Rejetés' },
];

const STATUS_STYLES: Record<ReviewStatus, string> = {
  PENDING: 'border-amber-500/40 text-amber-600 bg-amber-500/5',
  APPROVED: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5',
  REJECTED: 'border-destructive/40 text-destructive bg-destructive/5',
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

function StarRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < note ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

function ModerateActions({ id, status }: { id: string; status: ReviewStatus }) {
  const [isPendingApprove, startApprove] = useTransition();
  const [isPendingReject, startReject] = useTransition();
  if (status !== 'PENDING') return null;
  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
        disabled={isPendingApprove}
        onClick={() => startApprove(async () => {
          const r = await moderateReviewAction(id, 'APPROVED');
          if (!r.success) toast.error(r.error); else toast.success('Avis approuvé');
        })}
      >
        {isPendingApprove ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
        Approuver
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5"
        disabled={isPendingReject}
        onClick={() => startReject(async () => {
          const r = await moderateReviewAction(id, 'REJECTED');
          if (!r.success) toast.error(r.error); else toast.success('Avis rejeté');
        })}
      >
        {isPendingReject ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
        Rejeter
      </Button>
    </div>
  );
}

export function ReviewsClient({ data, currentPage, activeStatus }: ReviewsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const setStatus = (s: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('status', s);
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  };

  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(p));
    router.push(url.pathname + url.search);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter(
      (r) =>
        r.product.name.toLowerCase().includes(q) ||
        `${r.user.prenom} ${r.user.name}`.toLowerCase().includes(q) ||
        (r.comment ?? '').toLowerCase().includes(q),
    );
  }, [data.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button key={f.value} size="sm" variant={activeStatus === f.value ? 'default' : 'outline'} className="h-8 text-[12px]" onClick={() => setStatus(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Produit, auteur, commentaire..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-[13px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Star className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun avis trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((review) => (
                <div key={review.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-medium">{review.product.name}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {review.user.prenom} {review.user.name} · {format(new Date(review.createdAt), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StarRating note={review.notation} />
                      <Badge variant="outline" className={`text-[11px] ${STATUS_STYLES[review.status]}`}>
                        {STATUS_LABELS[review.status]}
                      </Badge>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-[13px] text-muted-foreground italic">"{review.comment}"</p>
                  )}
                  <ModerateActions id={review.id} status={review.status} />
                </div>
              ))}
            </div>
          )}
          {data.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">{data.total} avis · Page {currentPage} sur {data.pages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= data.pages}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
