import { redirect } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';

/**
 * Page racine : redirige selon l'état d'authentification.
 *
 * Le middleware s'occupe déjà de la majorité des cas, mais cette page
 * est utile si quelqu'un arrive directement sur /.
 */
export default async function RootPage() {
  const token = await getAccessToken();
  redirect(token ? '/dashboard' : '/login');
}
