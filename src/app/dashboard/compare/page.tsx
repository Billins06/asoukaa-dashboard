import type { Metadata } from 'next';
import { AltDashboard } from './_components/alt-dashboard';

export const metadata: Metadata = { title: 'Aperçu alternatif' };

export default function ComparePage() {
  return <AltDashboard />;
}
