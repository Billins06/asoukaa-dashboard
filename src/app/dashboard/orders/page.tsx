import type { Metadata } from 'next';
import { OrdersClient } from './_components/orders-client';

export const metadata: Metadata = { title: 'Commandes' };

export default function OrdersPage() {
  return <OrdersClient />;
}
