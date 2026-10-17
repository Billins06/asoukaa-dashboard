import { Badge } from '@/components/ui/badge';
import type { VendorCategory } from '@/lib/vendors/types';

interface VendorCategoriesProps {
  categories?: VendorCategory[];
  activityType: string;
}

// Catégories choisies par le vendeur en badges ; pour les anciens vendeurs
// (texte libre, categories vide ou absent) on garde le type d'activité.
export function VendorCategories({ categories, activityType }: VendorCategoriesProps) {
  if (!categories || categories.length === 0) {
    return <p className="text-[11px] text-muted-foreground">{activityType}</p>;
  }
  return (
    <div className="mt-0.5 flex flex-wrap gap-1">
      {categories.map((c) => (
        <Badge key={c.id} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
          {c.name}
        </Badge>
      ))}
    </div>
  );
}
