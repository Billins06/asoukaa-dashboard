'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, MapPin, Loader2, Save, Power, ChevronDown, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateDeliveryZoneAction } from '@/server/actions/delivery-zones-actions';
import type { DeliveryZone } from '@/lib/delivery-zones/types';

interface DeliveryZonesClientProps {
  zones: DeliveryZone[];
}

function FeeCell({ zone }: { zone: DeliveryZone }) {
  // Le serveur renvoie le montant sous forme de texte décimal ("1000.00") : on le convertit
  // pour que « 1000 » et « 1000.00 » soient vus comme la même valeur.
  const current = Number(zone.fraisLivraison);
  const [value, setValue] = useState(String(Number.isFinite(current) ? current : 0));
  const [isPending, startTransition] = useTransition();
  const dirty = value.trim() === '' || Number(value) !== current;

  const save = () => {
    const amount = Number(value);
    if (value.trim() === '' || !Number.isFinite(amount) || amount < 0) {
      toast.error('Montant invalide');
      return;
    }
    startTransition(async () => {
      const result = await updateDeliveryZoneAction(zone.id, { fraisLivraison: amount });
      if (result.success) toast.success(`${zone.commune} : ${amount} FCFA enregistré`);
      else toast.error(result.error);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-24 text-[13px]"
        disabled={isPending}
        aria-label={`Frais de livraison ${zone.commune}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && dirty && !isPending) save();
        }}
      />
      <span className="text-[11px] text-muted-foreground">FCFA</span>
      {dirty && (
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          onClick={save}
          disabled={isPending}
          title="Enregistrer le montant"
          aria-label={`Enregistrer les frais de ${zone.commune}`}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}

function ActiveToggle({ zone }: { zone: DeliveryZone }) {
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const result = await updateDeliveryZoneAction(zone.id, { isActive: !zone.isActive });
      if (result.success) {
        toast.success(zone.isActive ? `${zone.commune} désactivée` : `${zone.commune} activée`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className={`h-7 text-[11px] gap-1 ${
        zone.isActive
          ? 'text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/5'
          : 'text-muted-foreground'
      }`}
      onClick={toggle}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
      {zone.isActive ? 'Active' : 'Inactive'}
    </Button>
  );
}

export function DeliveryZonesClient({ zones }: DeliveryZonesClientProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleDepartement = (dep: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dep)) next.delete(dep);
      else next.add(dep);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return zones;
    const q = search.toLowerCase();
    return zones.filter(
      (z) => z.commune.toLowerCase().includes(q) || z.departement.toLowerCase().includes(q),
    );
  }, [zones, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DeliveryZone[]>();
    for (const z of filtered) {
      const list = map.get(z.departement) ?? [];
      list.push(z);
      map.set(z.departement, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Commune, département..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-[13px]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <MapPin className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune commune trouvée</p>
            </div>
          ) : (
            grouped.map(([departement, communes]) => {
              const isCollapsed = collapsed.has(departement);
              return (
                <div key={departement}>
                  <button
                    type="button"
                    onClick={() => toggleDepartement(departement)}
                    className="w-full px-6 py-2 bg-muted/30 border-y border-border flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <Badge variant="outline" className="text-[11px]">{departement}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {communes.length} commune{communes.length > 1 ? 's' : ''}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-border">
                      {communes.map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between gap-3 px-6 py-3">
                          <p className="text-[13px] font-medium text-foreground w-40 shrink-0">{zone.commune}</p>
                          <FeeCell zone={zone} />
                          <div className="ml-auto">
                            <ActiveToggle zone={zone} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
