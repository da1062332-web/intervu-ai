'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { normalizeApiError } from '@/services/api/error';
import { notifyApiError } from '@/services/notifications/toast';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((module) => module.ReactQueryDevtools),
  { ssr: false },
);

function shouldRetry(failureCount: number, error: unknown): boolean {
  const normalized = normalizeApiError(error);
  const nonRetryableStatuses = [400, 401, 403, 404, 422];

  if (nonRetryableStatuses.includes(normalized.status)) {
    return false;
  }

  return failureCount < 2;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        notifyApiError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        notifyApiError(error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: 'offlineFirst',
        retry: shouldRetry,
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: shouldRetry,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const showDevtools = process.env.NODE_ENV === 'development';

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {showDevtools && <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />}
    </QueryClientProvider>
  );
}
