import { StrictMode, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { TRPCProvider } from './providers/trpc-provider';
import { createTRPCSSRHelpers } from './utils/ssr-helper';
import { AuthContextProvider } from './providers/auth-provider';
import App from './App';
import { Toaster } from './components/ui/sonner';

export async function render(url: string, req?: Request) {
  const helpers = createTRPCSSRHelpers(req!);

  await helpers.viewer.prefetch();

  const dehydratedState = helpers.dehydrate();

  const html = renderToString(
    <StrictMode>
      <TRPCProvider dehydratedState={dehydratedState}>
        <StaticRouter location={url}>
          <Suspense fallback="Loading...">
            <AuthContextProvider>
              <App />
              <Toaster />
            </AuthContextProvider>
          </Suspense>
        </StaticRouter>
      </TRPCProvider>
    </StrictMode>
  );

  return {
    html,
    preloadedState: `<script>window.__PRELOADED_STATE__ = ${JSON.stringify(
      dehydratedState
    ).replace(/</g, '\\u003c')}</script>`,
  };
}
