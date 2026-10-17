'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Store,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ImagePreview } from '@/components/image-upload-field';
import { addBestShopAction, searchBestShopCandidatesAction } from '@/server/actions/vitrine-actions';
import {
  BEST_SHOPS_MAX,
  type BestShop,
  type BestShopCandidate,
  type BestShopCandidatesPage,
} from '@/lib/vitrine/types';

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 8;

interface AddBestShopDialogProps {
  currentCount: number;
  onAdded: (row: BestShop) => void;
}

export function AddBestShopDialog({ currentCount, onAdded }: AddBestShopDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<BestShopCandidatesPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const req = useRef(0);

  const q = query.trim();
  const isFull = currentCount >= BEST_SHOPS_MAX;

  // Recherche avec debounce ; les réponses obsolètes sont ignorées.
  useEffect(() => {
    if (!open) return;
    const reqId = ++req.current;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await searchBestShopCandidatesAction(q, page, PAGE_SIZE);
      if (req.current !== reqId) return;
      setLoading(false);
      if (!r.success) {
        setResult(null);
        setError(r.error);
        return;
      }
      setError(null);
      // La page demandée n'existe plus (dernier candidat de la page ajouté) : on recule.
      if (r.data.data.length === 0 && page > 1 && r.data.meta.totalPages > 0) {
        setPage(r.data.meta.totalPages);
        return;
      }
      setResult(r.data);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q, page, open, reloadKey]);

  const handleOpenChange = (o: boolean) => {
    if (addingId) return;
    if (o) {
      setQuery('');
      setPage(1);
      setResult(null);
      setError(null);
    }
    setOpen(o);
  };

  const add = async (c: BestShopCandidate) => {
    setAddingId(c.id);
    const r = await addBestShopAction(c.id);
    setAddingId(null);
    if (r.success) {
      toast.success(`« ${c.shopName} » ajoutée en fin de liste`);
      onAdded(r.data);
      setReloadKey((k) => k + 1); // la boutique ajoutée disparaît des candidats
    } else {
      toast.error(r.error);
    }
  };

  const meta = result?.meta;
  const totalPages = meta?.totalPages ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5" disabled={isFull} title={isFull ? 'La liste est complète' : undefined}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter une boutique
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Ajouter une boutique
          </DialogTitle>
          <DialogDescription>
            Vendeurs approuvés pas encore dans la liste ({currentCount} / {BEST_SHOPS_MAX}). La boutique est ajoutée en
            fin de liste.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une boutique…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="h-9 pl-8 text-[13px]"
            maxLength={100}
            autoFocus
          />
        </div>

        {isFull && (
          <p className="text-[12px] text-amber-700 dark:text-amber-400">
            La liste est complète : retirez une boutique pour en ajouter une autre.
          </p>
        )}

        <div className="rounded-lg border border-border">
          {loading && !result ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-[13px] text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Impossible de charger les boutiques : {error}</p>
              <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => setReloadKey((k) => k + 1)}>
                Réessayer
              </Button>
            </div>
          ) : !result || result.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Store className="h-7 w-7 opacity-30" />
              <p className="text-[13px]">{q ? 'Aucune boutique ne correspond à la recherche' : 'Aucune boutique disponible'}</p>
            </div>
          ) : (
            <ul className={`divide-y divide-border transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {result.data.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <ImagePreview
                    src={c.logoUrl}
                    alt={c.shopName}
                    className="h-10 w-10 shrink-0 rounded-full border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium" title={c.shopName}>
                      {c.shopName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.visibleProductCount} produit{c.visibleProductCount > 1 ? 's' : ''} visible
                      {c.visibleProductCount > 1 ? 's' : ''}
                    </p>
                    {(c.shopVisible === false || c.visibleProductCount === 0) && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {c.shopVisible === false ? 'Boutique masquée' : 'Aucun produit visible'} : elle ne s&apos;affichera pas
                        tout de suite.
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 gap-1 text-[12px]"
                    disabled={isFull || addingId !== null}
                    onClick={() => void add(c)}
                  >
                    {addingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Ajouter
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">
              {meta?.total} boutique{(meta?.total ?? 0) > 1 ? 's' : ''} · Page {page} sur {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Page précédente"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Page suivante"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
