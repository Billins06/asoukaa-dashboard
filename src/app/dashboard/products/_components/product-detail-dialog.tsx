'use client';

import { useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocalDate } from '@/components/local-date';
import { formatFCFA, formatNumber } from '@/lib/format';
import { getProductDetailAction } from '@/server/actions/products-actions';
import type { AdminProductDetail } from '@/lib/products/types';

export function ProductDetailButton({ productId, name }: { productId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<AdminProductDetail | null>(null);

  // Rechargé à CHAQUE ouverture : le statut peut avoir changé (désactivation / réactivation).
  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const result = await getProductDetailAction(productId);
      if (result.success) setProduct(result.data);
      else setError(result.error);
    } catch {
      setError('Le serveur ne répond pas. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground"
        title="Voir le produit"
        aria-label={`Voir ${name}`}
        onClick={openDialog}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="break-words">{name}</DialogTitle>
            <DialogDescription>Fiche produit (consultation)</DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && <p className="text-[13px] text-destructive">{error}</p>}

          {product && (
            <div className="space-y-4 text-[13px]">
              {product.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img) =>
                    img.isVideo ? (
                      <video
                        key={img.id}
                        src={img.url}
                        controls
                        preload="none"
                        className="h-24 w-24 shrink-0 rounded-md border border-border object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        loading="lazy"
                        className="h-24 w-24 shrink-0 rounded-md border border-border object-cover"
                      />
                    ),
                  )}
                </div>
              )}

              {product.isBlockedByAdmin && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  <p className="font-medium">Désactivé par l&apos;administration</p>
                  {product.adminBlockReason && <p className="mt-0.5">Motif : {product.adminBlockReason}</p>}
                </div>
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">Boutique</dt>
                <dd>{product.vendor?.shopName ?? '—'}</dd>
                <dt className="text-muted-foreground">Prix</dt>
                <dd className="font-semibold">{formatFCFA(product.basePrice)}</dd>
                <dt className="text-muted-foreground">Statut</dt>
                <dd>{product.status}</dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd>{product.isDigital ? 'Livre numérique (PDF)' : 'Produit physique'}</dd>
                {product.isDigital && (
                  <>
                    <dt className="text-muted-foreground">Auteur</dt>
                    <dd>{product.author ?? '—'}</dd>
                    <dt className="text-muted-foreground">Pages / langue</dt>
                    <dd>
                      {product.pageCount ?? '—'} p. · {product.language ?? '—'}
                    </dd>
                  </>
                )}
                <dt className="text-muted-foreground">Catégories</dt>
                <dd>{product.categories.map((c) => c.name).join(', ') || '—'}</dd>
                <dt className="text-muted-foreground">Ventes · vues</dt>
                <dd>
                  {formatNumber(product.totalVentes)} · {formatNumber(product.nombreVues)}
                </dd>
                <dt className="text-muted-foreground">Note</dt>
                <dd>
                  {Number(product.noteMoyenne).toFixed(1)} / 5 ({product.nbreAvis} avis)
                </dd>
                <dt className="text-muted-foreground">Créé le</dt>
                <dd>
                  <LocalDate iso={product.createdAt} />
                </dd>
              </dl>

              {product.description && (
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="whitespace-pre-wrap break-words">{product.description}</p>
                </div>
              )}

              {!product.isDigital && product.variants.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Variantes</p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-[12px]">
                      <thead className="bg-muted/30 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-medium">Référence</th>
                          <th className="px-3 py-1.5 text-left font-medium">Détail</th>
                          <th className="px-3 py-1.5 text-left font-medium">Prix</th>
                          <th className="px-3 py-1.5 text-left font-medium">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {product.variants.map((v) => (
                          <tr key={v.id}>
                            <td className="px-3 py-1.5 font-mono">{v.sku}</td>
                            <td className="px-3 py-1.5">
                              {[v.color, v.size, v.model].filter(Boolean).join(' · ') || '—'}
                            </td>
                            <td className="px-3 py-1.5">{formatFCFA(v.price)}</td>
                            <td className="px-3 py-1.5">{v.stockQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
