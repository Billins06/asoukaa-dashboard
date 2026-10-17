'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { replyTicketAction } from '@/server/actions/support-actions';
import { uploadImage } from '@/lib/upload/client';
import { isTrustedTicketImage } from '@/lib/support/safe-image';
import { TICKET_MAX_ATTACHMENTS, TICKET_MAX_MESSAGE } from '@/lib/support/types';
import { TicketImage } from './ticket-image';

interface TicketComposerProps {
  ticketId: string;
  allowedHosts: readonly string[];
  onOpenImage: (url: string) => void;
}

export function TicketComposer({ ticketId, allowedHosts, onOpenImage }: TicketComposerProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSending, startSending] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = TICKET_MAX_ATTACHMENTS - images.length;
  const trimmed = text.trim();
  const tooLong = text.length > TICKET_MAX_MESSAGE;
  const canSend = trimmed.length > 0 && !tooLong && !uploading && !isSending;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (files.length === 0) return;
    if (files.length > remaining) {
      toast.error(`Maximum ${TICKET_MAX_ATTACHMENTS} images par message.`);
    }
    const batch = files.slice(0, Math.max(0, remaining));
    if (batch.length === 0) return;

    setUploading(true);
    try {
      for (const file of batch) {
        try {
          const url = await uploadImage(file, 'tickets');
          if (!isTrustedTicketImage(url, allowedHosts)) {
            toast.error("L'image envoyée n'a pas pu être vérifiée. Réessayez.");
            continue;
          }
          setImages((prev) => (prev.length >= TICKET_MAX_ATTACHMENTS || prev.includes(url) ? prev : [...prev, url]));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Échec de l'envoi de l'image");
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const send = () => {
    if (!canSend) return;
    startSending(async () => {
      const r = await replyTicketAction(ticketId, trimmed, images);
      if (r.success) {
        setText('');
        setImages([]);
        toast.success('Réponse envoyée');
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Écrivez votre réponse…"
        className="min-h-24 text-[13px]"
        disabled={isSending}
        aria-label="Votre réponse"
        aria-invalid={tooLong}
      />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative">
              <TicketImage url={url} allowedHosts={allowedHosts} onOpen={onOpenImage} className="h-16 w-16" />
              <button
                type="button"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow"
                aria-label="Retirer l'image"
                title="Retirer"
                disabled={isSending}
                onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFiles}
          disabled={uploading || isSending || remaining <= 0}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-[12px]"
          disabled={uploading || isSending || remaining <= 0}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          Ajouter des images ({images.length}/{TICKET_MAX_ATTACHMENTS})
        </Button>
        <span className={`text-[11px] ${tooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
          {text.length} / {TICKET_MAX_MESSAGE}
        </span>
        <Button type="button" size="sm" className="ml-auto h-8 gap-1.5" disabled={!canSend} onClick={send}>
          {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Envoyer
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        JPG, PNG ou WEBP · 5 Mo max. par image. Votre réponse apparaît sous le nom « Équipe Asoukaa » dans
        l&apos;application. Ctrl + Entrée pour envoyer.
      </p>
    </div>
  );
}
