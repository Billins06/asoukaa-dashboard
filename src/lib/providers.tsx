'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

/**
 * Providers client-side : React Query, futurs ThemeProvider, etc.
 *
 * Le QueryClient est créé dans un useState pour éviter qu'il soit
 * recréé à chaque render (important pour le cache).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,            // données fraîches pendant 30s
            gcTime: 5 * 60_000,           // gardées en cache 5min après inactivité
            refetchOnWindowFocus: false,  // évite les refetch agressifs
            retry: 1,                     // 1 retry sur erreur réseau
          },
          mutations: {
            retry: 0, // ne JAMAIS retry une mutation (risque double-soumission)
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools désactivés en prod */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
