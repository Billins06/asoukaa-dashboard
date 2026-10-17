import type { Metadata } from 'next';
import { Suspense } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { InlineError, errorMessage } from '@/components/inline-error';
import { getDeliveryZones } from '@/lib/delivery-zones/api';
import { DeliveryZonesClient } from './_components/delivery-zones-client';
import { DeliveryZonesTableSkeleton } from './_components/delivery-zones-skeleton';

export const metadata: Metadata = { title: 'Livraison' };

export default function DeliveryZonesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Livraison par commune</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Frais de livraison fixes par commune (77 communes du Bénin)
        </p>
      </div>

      <Suspense fallback={<DeliveryZonesTableSkeleton />}>
        <DeliveryZonesDataServer />
      </Suspense>
    </div>
  );
}

async function DeliveryZonesDataServer() {
  let zones;
  try {
    zones = await getDeliveryZones();
  } catch (error) {
    unstable_rethrow(error);
    return <InlineError title="Impossible de charger les zones de livraison." message={errorMessage(error)} />;
  }
  return <DeliveryZonesClient zones={Array.isArray(zones) ? zones : []} />;
}
