import 'server-only';

import { api } from '@/lib/api';
import type { DeliveryZone } from './types';

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  return api.get<DeliveryZone[]>('/delivery-zones');
}
