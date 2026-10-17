'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Star } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LocalDate } from '@/components/local-date';
import { cn } from '@/lib/utils';
import { moderateReviewAction } from '@/server/actions/reviews-actions';
import { REVIEW_STATUS, REVIEW_STATUS_LIST, reviewStatusMeta } from '@/lib/status-meta';
import type { ReviewListItem, BackendPaginated } from '@/lib/reviews/types';

interface ReviewsClientProps {
  data: BackendPaginated<ReviewListItem>;
  currentPage: number;
  activeStatus: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous' },
  ...REVIEW_STATUS_LIST.map((value) => ({ value, label: reviewStatusMeta(value).filterLabel })),
];

function StarRating({ note }: { note: number }) {
  // Note illisible ou hors 0–5 : on borne pour ne jamais afficher de n étoiles absurde.
  const n = Number.isFinite(Number(note)) ? Math.min(5, Math.max(0, Math.round(Number(note)))) : 0;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note : ${n} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

function authorName(review: ReviewListItem): string {
  return `${review.user?.prenom ?? ''} ${review.user?.name ?? ''}`.trim() || 'Client inconnu';
}

function productName(review: ReviewListItem): string {
  return review.product?.prod_name?.trim() || 'Produit supprimé';
}

function ModerateActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmReject, setConfirmReject] = useState(false);
  if (status !== REVIEW_STATUS.PENDING) return null;

  const moderate = (target: typeof REVIEW_STATUS.APPROVED | typeof REVIEW_STATUS.REJECTED) =>
    startTransition(async () => {
      const r = await moderateReviewAction(id, target);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(target === REVIEW_STATUS.APPROVED ? 'Avis approuvé' : 'Avis rejeté');
      setConfirmReject(false);
    });

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5"
          disabled={isPending}
          onClick={() => moderate(REVIEW_STATUS.APPROVED)}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
          Approuver
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/5"
          disabled={isPending}
          onClick={() => setConfirmReject(true)}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Rejeter
        </Button>
      </div>

      {/* Le rejet est définitif : le serveur refuse de re-modérer un avis déjà traité. */}
      <Dialog open={confirmReject} onOpenChange={(o) => { if (!isPending) setConfirmReject(o); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Rejeter cet avis ?
            </DialogTitle>
            <DialogDescription>
              L&apos;avis ne sera pas publié. Cette décision est définitive : un avis déjà modéré ne peut plus être modifié.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReject(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => moderate(REVIEW_STATUS.REJECTED)} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Rejeter l&apos;avis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
        productName(r).toLowerCase().includes(q) ||
        authorName(r).toLowerCase().includes(q) ||
        (r.comment ?? '').toLowerCase().includes(q),
    );
  }, [data.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button key={f.value} size="sm" variant={activeStatus === f.value ? 'default' : 'outline'} className="h-8 text-[12px]" aria-pressed={activeStatus === f.value} onClick={() => setStatus(f.value)}>
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
          {search.trim() && data.pages > 1 && (
            <p className="text-[11px] text-muted-foreground">La recherche porte uniquement sur les avis de cette page.</p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Star className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {activeStatus === REVIEW_STATUS.PENDING && !search.trim()
                  ? 'Aucun avis en attente de modération'
                  : 'Aucun avis trouvé'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((review) => {
                const meta = reviewStatusMeta(review.status);
                return (
                  <div key={review.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-medium">{productName(review)}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {authorName(review)} · <LocalDate iso={review.createdAt} pattern="d MMM yyyy" />
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StarRating note={review.notation} />
                        <Badge variant="outline" className={cn('text-[11px]', meta.badge)}>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-[13px] text-muted-foreground italic">« {review.comment} »</p>
                    )}
                    <ModerateActions id={review.id} status={review.status} />
                  </div>
                );
              })}
            </div>
          )}
          {data.total > 0 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
              <p className="text-[12px] text-muted-foreground">{data.total} avis · Page {currentPage} sur {Math.max(1, data.pages)}</p>
              {data.pages > 1 && (
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Page précédente" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Page suivante" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= data.pages}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
