import type React from 'react';
import { useStable } from '@/hooks/use-stable';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { TRPCProvider as TRPCProviderImpl } from '@/utils/trpc';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src';
import { canUseDOM } from '@/utils/can-use-dom';

interface TRPCProviderProps {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | null = null;

function getQueryClient() {
  if (!canUseDOM) {
    return makeQueryClient();
  }

  return (browserQueryClient ??= makeQueryClient());
}

function getURL() {
  const base = (() => {
    if (canUseDOM) return '';
    if (import.meta.env.VITE_APP_API_SERVER_URL)
      return import.meta.env.VITE_APP_API_SERVER_URL;
    return 'http://localhost:3000';
  })();
  return `${base}/api/trpc`;
}

export function TRPCProvider({ children, dehydratedState }: TRPCProviderProps) {
  const queryClient = useStable(getQueryClient);
  const trpcClient = useStable(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getURL(),
          fetch: (url, options) =>
            fetch(url, { ...options, credentials: 'include', mode: 'cors' }),
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProviderImpl queryClient={queryClient} trpcClient={trpcClient}>
        <HydrationBoundary state={dehydratedState}>
          {children}
        </HydrationBoundary>
      </TRPCProviderImpl>
    </QueryClientProvider>
  );
}
