'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, FileText, ImageOff, Loader2, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { getKycMediaAction } from '@/server/actions/kyc-actions';
import type { KycMediaItem, KycTarget } from '@/lib/media/kyc-types';
import { cn } from '@/lib/utils';

interface KycGalleryProps {
  target: KycTarget;
  id: string;
  /** Nom du candidat, pour les textes alternatifs (« Selfie de Awa Koné »). */
  ownerName: string;
  /** Ne charge les pièces que lorsque la fenêtre qui contient la galerie est ouverte. */
  active: boolean;
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: KycMediaItem[] };

/**
 * Pièces jointes d'une candidature (identité, selfie, photos) en miniatures cliquables.
 *
 * - chargées à l'ouverture de la fenêtre de validation (une seule fois) ;
 * - clic sur une miniature → agrandissement (lightbox) avec « Ouvrir dans un onglet » ;
 * - PDF → icône + lien « Ouvrir » (pas de miniature) ;
 * - une pièce absente ou non affichable est signalée clairement, jamais masquée.
 */
export function KycGallery({ target, id, ownerName, active }: KycGalleryProps) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [preview, setPreview] = useState<KycMediaItem | null>(null);
  const requested = useRef(false);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const result = await getKycMediaAction(target, id);
      setState(
        result.success
          ? { status: 'ready', items: result.data }
          : { status: 'error', message: result.error },
      );
    } catch {
      setState({ status: 'error', message: 'Impossible de charger les pièces jointes.' });
    }
  }, [target, id]);

  useEffect(() => {
    if (active && !requested.current) {
      requested.current = true;
      void load();
    }
  }, [active, load]);

  const alt = (item: KycMediaItem) => `${item.label} de ${ownerName}`;

  return (
    <section aria-label="Pièces jointes du dossier" className="space-y-2">
      <h3 className="text-[13px] font-medium">Pièces jointes</h3>

      {(state.status === 'idle' || state.status === 'loading') && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Chargement des pièces…
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          <span>{state.message}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-[11px]"
            onClick={() => void load()}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Réessayer
          </Button>
        </div>
      )}

      {state.status === 'ready' && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {state.items.map((item) => (
            <li key={item.key} className="min-w-0">
              <Thumb item={item} alt={alt(item)} onOpen={() => setPreview(item)} />
              <p className="mt-1 truncate text-center text-[10px] text-muted-foreground" title={item.label}>
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="p-3 sm:max-w-3xl">
          <DialogTitle className="pr-8 text-sm">{preview ? alt(preview) : 'Aperçu'}</DialogTitle>
          <DialogDescription className="sr-only">Pièce jointe du dossier, affichée en grand.</DialogDescription>
          {preview?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.src}
              alt={alt(preview)}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] w-full rounded-lg bg-muted object-contain"
            />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {preview?.src && (
              <Button asChild variant="outline" size="sm">
                <a href={preview.src} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Ouvrir dans un onglet
                </a>
              </Button>
            )}
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm">
                <X className="mr-1 h-3.5 w-3.5" />
                Fermer
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Placeholder({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 p-1 text-center text-muted-foreground"
      title={title}
    >
      <ImageOff className="h-4 w-4 opacity-60" />
      <span className="text-[9px] leading-tight">{children}</span>
    </div>
  );
}

function Thumb({ item, alt, onOpen }: { item: KycMediaItem; alt: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);

  if (item.status === 'missing') {
    return <Placeholder title={`${item.label} : non fournie`}>Non fournie</Placeholder>;
  }
  if (item.status === 'unsafe' || !item.src) {
    return (
      <Placeholder title={`${item.label} : adresse non reconnue, fichier non affiché`}>Non affichée</Placeholder>
    );
  }

  if (item.isPdf) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <a
          href={item.src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ouvrir le document PDF : ${alt}`}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          Ouvrir
        </a>
      </div>
    );
  }

  if (failed) {
    return <Placeholder title={`${item.label} : fichier introuvable`}>Introuvable</Placeholder>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Agrandir"
      aria-label={`Agrandir : ${alt}`}
      className={cn(
        'aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'transition-opacity hover:opacity-90',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </button>
  );
}
