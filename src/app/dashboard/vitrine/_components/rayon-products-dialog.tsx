'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImagePreview } from '@/components/image-upload-field';
import {
  getRayonDetailAction,
  searchVitrineProductsAction,
  setRayonProductsAction,
} from '@/server/actions/vitrine-actions';
import { RAYON_MAX_PRODUCTS, type Rayon, type VitrineProduct } from '@/lib/vitrine/types';
import { formatFcfa, productStatusLabel } from './vitrine-utils';

const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 20;

function ProductLine({ product, children }: { product: VitrineProduct; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <ImagePreview src={product.imageUrl} alt={product.name} className="h-10 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium" title={product.name}>
          {product.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">{formatFcfa(product.price)}</span>
          {product.shopName ? ` · ${product.shopName}` : ''}
        </p>
      </div>
      {!product.isActive && (
        <Badge
          variant="outline"
          className="shrink-0 gap-1 text-[10px] border-amber-500/40 text-amber-700 bg-amber-500/10 dark:text-amber-400"
          title="Ce produit n'est pas actif : il ne sera pas visible dans l'application."
        >
          <AlertTriangle className="h-3 w-3" />
          {productStatusLabel(product.status)} · non visible
        </Badge>
      )}
      <div className="flex shrink-0 items-center gap-0.5">{children}</div>
    </div>
  );
}

interface RayonProductsDialogProps {
  rayon: Pick<Rayon, 'id' | 'nom'>;
  children: React.ReactNode;
}

export function RayonProductsDialog({ rayon, children }: RayonProductsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();

  // Liste du rayon
  const [products, setProducts] = useState<VitrineProduct[]>([]);
  const [initialIds, setInitialIds] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Recherche
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VitrineProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchReq = useRef(0);
  const loadReq = useRef(0);

  const ids = products.map((p) => p.id);
  const idSet = new Set(ids);
  const dirty = ids.join(',') !== initialIds;
  const hiddenCount = products.filter((p) => !p.isActive).length;
  const q = query.trim();

  const load = async () => {
    const reqId = ++loadReq.current;
    setLoading(true);
    setLoadError(null);
    const r = await getRayonDetailAction(rayon.id);
    if (loadReq.current !== reqId) return;
    setLoading(false);
    if (r.success) {
      setProducts(r.data.products);
      setInitialIds(r.data.products.map((p) => p.id).join(','));
    } else {
      setProducts([]);
      setInitialIds('');
      setLoadError(r.error);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (isSaving) return;
    if (!o && dirty && !confirm('Abandonner les modifications non enregistrées ?')) return;
    if (o) {
      setQuery('');
      setResults([]);
      setSearchError(null);
      void load();
    }
    setOpen(o);
  };

  // Recherche avec debounce ; les réponses obsolètes sont ignorées.
  // Champ vide = produits les plus récents (le backend accepte search vide).
  useEffect(() => {
    if (!open) return;
    const reqId = ++searchReq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await searchVitrineProductsAction(q, SEARCH_LIMIT);
      if (searchReq.current !== reqId) return;
      setSearching(false);
      if (r.success) {
        setResults(r.data);
        setSearchError(null);
      } else {
        setResults([]);
        setSearchError(r.error);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q, open]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= products.length) return;
    setProducts((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const add = (product: VitrineProduct) => {
    if (idSet.has(product.id)) return; // pas de doublon
    if (products.length >= RAYON_MAX_PRODUCTS) {
      toast.error(`Un rayon ne peut pas contenir plus de ${RAYON_MAX_PRODUCTS} produits.`);
      return;
    }
    setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
  };

  const handleSave = () => {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length > RAYON_MAX_PRODUCTS) {
      toast.error(`Un rayon ne peut pas contenir plus de ${RAYON_MAX_PRODUCTS} produits.`);
      return;
    }
    startSaving(async () => {
      const r = await setRayonProductsAction(rayon.id, uniqueIds);
      if (r.success) {
        toast.success('Produits du rayon enregistrés');
        setInitialIds(uniqueIds.join(','));
        setOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits du rayon « {rayon.nom} »
          </DialogTitle>
          <DialogDescription>
            L&apos;ordre de la liste est l&apos;ordre d&apos;affichage dans l&apos;application ({RAYON_MAX_PRODUCTS} produits max.).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Produits du rayon */}
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-muted-foreground">
              Dans le rayon ({products.length}/{RAYON_MAX_PRODUCTS})
              {dirty && !loading && <span className="ml-2 text-primary">· modifications non enregistrées</span>}
            </p>
            {!loading && hiddenCount > 0 && (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {hiddenCount > 1
                  ? `${hiddenCount} produits non actifs : ils ne seront pas visibles dans l'application.`
                  : "1 produit non actif : il ne sera pas visible dans l'application."}
              </p>
            )}
            <div className="rounded-lg border border-border">
              {loading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-[13px] text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>Impossible de charger les produits : {loadError}</p>
                  <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => void load()}>
                    Réessayer
                  </Button>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Package className="h-7 w-7 opacity-30" />
                  <p className="text-[13px]">Aucun produit dans ce rayon</p>
                  <p className="text-[11px]">Utilisez la recherche pour en ajouter.</p>
                </div>
              ) : (
                <div className="max-h-[50vh] divide-y divide-border overflow-y-auto">
                  {products.map((p, i) => (
                    <ProductLine key={p.id} product={p}>
                      <span className="w-6 text-right text-[11px] text-muted-foreground">{i + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="Monter"
                        disabled={i === 0 || isSaving}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="Descendre"
                        disabled={i === products.length - 1 || isSaving}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Retirer du rayon"
                        disabled={isSaving}
                        onClick={() => remove(p.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </ProductLine>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recherche (à gauche sur grand écran) */}
          <div className="space-y-2 lg:order-first">
            <p className="text-[12px] font-medium text-muted-foreground">
              Ajouter des produits {q ? '' : '· les plus récents'}
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit (nom)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-8 text-[13px]"
                disabled={loading || !!loadError}
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="rounded-lg border border-border">
              {searchError ? (
                <div className="flex items-center gap-2 px-4 py-6 text-[13px] text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Recherche impossible : {searchError}</span>
                </div>
              ) : results.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                  {searching ? 'Recherche en cours…' : 'Aucun produit trouvé.'}
                </p>
              ) : (
                <div className="max-h-[50vh] divide-y divide-border overflow-y-auto">
                  {results.map((p) => {
                    const already = idSet.has(p.id);
                    return (
                      <ProductLine key={p.id} product={p}>
                        <Button
                          size="sm"
                          variant={already ? 'ghost' : 'outline'}
                          className="h-7 gap-1 text-[12px]"
                          disabled={already || isSaving}
                          onClick={() => add(p)}
                        >
                          {already ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {already ? 'Ajouté' : 'Ajouter'}
                        </Button>
                      </ProductLine>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Fermer
          </Button>
          <Button onClick={handleSave} disabled={isSaving || loading || !!loadError || !dirty}>
            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
