import {api} from '@/services/api';
import {createRootRouteWithContext, Outlet} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools';
import {TRPCOptionsProxy} from '@trpc/tanstack-react-query';
import {TooltipProvider} from '@/components/ui/tooltip';
import {Toaster} from '@/components/ui/sonner';
import type {QueryClient} from '@tanstack/react-query';
import type {AppRouter} from '../../../api/src';
import {TransLayer} from '@/components/trans-layer';
import {PageProgressAnimation} from '@/components/page-progress-animation';

interface RouterContext {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({context}) => {
    const session = await context.queryClient.ensureQueryData(
      api.auth.session.queryOptions(),
    );
    return {session};
  },
  component: RootLayout,
  pendingComponent: () => 'Loading...',
});

function RootLayout() {
  return (
    <>
      <PageProgressAnimation />
      <TooltipProvider>
        <Outlet />
        <Toaster />
      </TooltipProvider>
      <TransLayer />
      <TanStackRouterDevtools position='top-right' />
    </>
  );
}
