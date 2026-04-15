// Import the generated route tree
import {createRouter} from '@tanstack/react-router';
import {routeTree} from './routeTree.gen';
import {getReactQueryClient} from './utils/react-query-client';
import {QueryClientProvider} from '@tanstack/react-query';
import {TRPCProvider} from './utils/trpc';
import {createTRPCOptionsProxy} from '@trpc/tanstack-react-query';
import {trpcClient} from './utils/trpc-client';
import type {AppRouter} from '../../packages/api/src';

// Create a new router instance

function getRouter() {
  const queryClient = getReactQueryClient();
  const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  });

  return createRouter({
    context: {
      queryClient,
      trpc,
    },
    routeTree,
    Wrap(props) {
      return (
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            {props.children}
          </TRPCProvider>
        </QueryClientProvider>
      );
    },
  });
}
export const router = getRouter();

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
