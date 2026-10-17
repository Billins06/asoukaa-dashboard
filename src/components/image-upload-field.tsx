'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageOff, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/lib/upload/client';
import type { UploadImageType } from '@/lib/upload/constants';

interface ImageUploadFieldProps {
  /** URL actuelle ('' = aucune image) */
  value: string;
  onChange: (url: string) => void;
  type: UploadImageType;
  /** 'round' = miniature ronde, 'banner' = aperçu rectangulaire large */
  shape?: 'round' | 'banner';
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  /** Aide affichée sous les boutons (ex : « Image carrée conseillée ») */
  hint?: string;
  /** false = pas de bouton « Retirer » (image obligatoire : on ne peut que la remplacer). */
  allowRemove?: boolean;
  className?: string;
}

/** Aperçu d'image avec repli si l'URL est cassée. */
export function ImagePreview({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}>
        {src ? <ImageOff className="h-4 w-4 opacity-60" /> : <ImagePlus className="h-4 w-4 opacity-60" />}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} referrerPolicy="no-referrer" className={cn('object-cover bg-muted', className)} onError={() => setFailedSrc(src)} />
  );
}

export function ImageUploadField({
  value,
  onChange,
  type,
  shape = 'round',
  disabled,
  onUploadingChange,
  hint,
  allowRemove = true,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBusy = (b: boolean) => {
    setUploading(b);
    onUploadingChange?.(b);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const url = await uploadImage(file, type);
      onChange(url);
      toast.success('Image envoyée');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'envoi de l'image";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const isDisabled = disabled || uploading;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative shrink-0">
        <ImagePreview
          src={value || null}
          alt="Aperçu"
          className={cn(
            'border border-border',
            shape === 'round' ? 'h-16 w-16 rounded-full' : 'h-16 w-40 rounded-lg',
          )}
        />
        {uploading && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-background/70',
              shape === 'round' ? 'rounded-full' : 'rounded-lg',
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-[12px]"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {value ? "Changer l'image" : 'Envoyer une image'}
          </Button>
          {value && allowRemove && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1 text-[12px] text-muted-foreground hover:text-destructive"
              disabled={isDisabled}
              onClick={() => {
                setError(null);
                onChange('');
              }}
            >
              <X className="h-3.5 w-3.5" />
              Retirer
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          JPG, PNG ou WEBP · 5 Mo max.{hint ? ` · ${hint}` : ''}
        </p>
        {error && (
          <p role="alert" className="text-[11px] text-destructive">
            {error}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        disabled={isDisabled}
      />
    </div>
  );
}
