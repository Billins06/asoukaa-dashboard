'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImagePreview } from '@/components/image-upload-field';
import { lookupBannerTargetsAction } from '@/server/actions/banners-actions';
import type { TargetOption } from '@/lib/banners/types';

export interface PickedTarget {
  id: string;
  label: string;
}

interface TargetPickerProps {
  type: 'category' | 'product' | 'shop';
  value: PickedTarget | null;
  onChange: (value: PickedTarget | null) => void;
  disabled?: boolean;
}

const PLACEHOLDERS: Record<TargetPickerProps['type'], string> = {
  category: 'Rechercher une catégorie…',
  product: 'Rechercher un produit par son nom…',
  shop: 'Rechercher une boutique par son nom…',
};

/** Recherche (avec délai) puis choix d'une catégorie, d'un produit ou d'une boutique. */
export function TargetPicker({ type, value, onChange, disabled }: TargetPickerProps) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<TargetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    // Numéro de requête : une réponse arrivée en retard est ignorée.
    const mySeq = ++seq.current;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError(null);
        const r = await lookupBannerTargetsAction(type, search.trim());
        if (mySeq !== seq.current) return;
        setLoading(false);
        if (r.success) {
          setOptions(r.data);
        } else {
          setOptions([]);
          setError(r.error);
        }
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [type, search]);

  return (
    <div className="space-y-2">
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-[13px]">
          <span className="flex min-w-0 items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium">{value.label}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Changer de choix"
            aria-label="Retirer le choix"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={PLACEHOLDERS[type]}
          aria-label={PLACEHOLDERS[type]}
          className="pl-8 text-[13px]"
          disabled={disabled}
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
        {error ? (
          <p className="px-3 py-3 text-[12px] text-destructive">{error}</p>
        ) : options.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-muted-foreground">
            {loading ? 'Recherche…' : 'Aucun résultat'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ id: o.id, label: o.label })}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted ${
                    value?.id === o.id ? 'bg-primary/5' : ''
                  }`}
                >
                  {o.imageUrl && (
                    <ImagePreview src={o.imageUrl} alt={o.label} className="h-7 w-7 shrink-0 rounded-full" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.label}</span>
                    {o.sublabel && (
                      <span className="block truncate text-[11px] text-muted-foreground">{o.sublabel}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
