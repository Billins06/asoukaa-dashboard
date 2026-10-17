'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/** Aperçu agrandi. `url` doit avoir été contrôlé par isTrustedTicketImage. */
export function TicketImageLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Dialog open={url !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-2 sm:max-w-3xl">
        <DialogTitle className="sr-only">Aperçu de l&apos;image</DialogTitle>
        <DialogDescription className="sr-only">Image jointe au ticket, affichée en grand.</DialogDescription>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Pièce jointe agrandie"
            referrerPolicy="no-referrer"
            className="max-h-[80vh] w-full rounded-lg bg-muted object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
