'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTrustedTicketImage } from '@/lib/support/safe-image';

interface TicketImageProps {
  url: string;
  allowedHosts: readonly string[];
  /** Appelé avec l'URL (déjà contrôlée) quand on clique sur la vignette. */
  onOpen: (url: string) => void;
  className?: string;
}

/**
 * Vignette d'une image jointe. L'URL vient d'un utilisateur : elle n'est
 * affichée que si elle a la forme d'un fichier de notre serveur d'envoi
 * (voir lib/support/safe-image). Aucun lien externe n'est créé : le clic
 * ouvre un aperçu agrandi dans l'application.
 */
export function TicketImage({ url, allowedHosts, onOpen, className }: TicketImageProps) {
  const [failed, setFailed] = useState(false);
  const trusted = isTrustedTicketImage(url, allowedHosts);

  if (!trusted || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 p-1 text-center text-muted-foreground',
          className,
        )}
        title={trusted ? 'Image introuvable' : "Image non affichée : source non reconnue"}
      >
        <ImageOff className="h-4 w-4 opacity-60" />
        <span className="text-[9px] leading-tight">{trusted ? 'Introuvable' : 'Non affichée'}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(url)}
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      title="Agrandir"
      aria-label="Agrandir l'image"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Pièce jointe"
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </button>
  );
}
