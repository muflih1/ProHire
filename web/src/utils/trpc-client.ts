import {createTRPCClient, httpBatchLink} from '@trpc/client';
import superjson from 'superjson';
import type {AppRouter} from '../../../packages/api/src';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: (url, options) =>
        fetch(url, {...options, credentials: 'include', mode: 'cors'}),
      transformer: superjson,
    }),
  ],
});
