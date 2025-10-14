import { StrictMode, Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { createTRPCSSRHelpers } from './utils/ssr-helper';
import { StaticRouter } from 'react-router';
import { TRPCProvider } from './providers/trpc-provider';
import { AuthProvider } from './providers/auth-provider';
import App from './App';
import { Toaster } from './components/ui/sonner';
import type { Request, Response } from 'express';
import { Transform } from 'stream';
import superjson from 'superjson';

export async function render(
  url: string,
  req: Request,
  res: Response,
  template: string
) {
  const helpers = createTRPCSSRHelpers(req!);
  await helpers.viewer.prefetch();
  const dehydratedState = helpers.dehydrate();

  const preloadedState = `<script type="text/javascript">window.__PRELOADED_STATE__ = ${JSON.stringify(
    superjson.serialize(dehydratedState)
  )}</script>`;

  let didError = false;

  const { pipe, abort } = renderToPipeableStream(
    <StrictMode>
      <TRPCProvider dehydratedState={dehydratedState}>
        <StaticRouter location={url}>
          <Suspense fallback='Loading...'>
            <AuthProvider>
              <App />
              <Toaster />
            </AuthProvider>
          </Suspense>
        </StaticRouter>
      </TRPCProvider>
      {/* @ts-ignore */}
      <vite-streaming-end></vite-streaming-end>
    </StrictMode>,
    {
      onShellError() {
        res.status(500);
        res.set({ 'Content-Type': 'text/html' });
        res.send('<h1>Somthing went wrong</h1>');
      },
      onShellReady() {
        res.status(didError ? 500 : 200);
        res.set({ 'Content-Type': 'text/html' });
        const [htmlStart, htmlEnd] = template.split(`<!--app-html-->`);
        let htmlEnded = false;

        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            if (!htmlEnded) {
              chunk = chunk.toString();
              if (chunk.endsWith('<vite-streaming-end></vite-streaming-end>')) {
                res.write(
                  chunk.slice(0, -41) +
                    htmlEnd.replace(`<!--preloaded-state-->`, preloadedState),
                  'utf-8'
                );
              } else {
                res.write(chunk, 'utf-8');
              }
            } else {
              res.write(chunk, encoding);
            }
            callback();
          },
        });

        transformStream.on('finish', () => {
          res.end();
        });

        res.write(htmlStart.replace(`<!--app-head-->`, ''));

        pipe(transformStream);
      },
      onError(err) {
        didError = true;
        console.error(err);
      },
    }
  );

  setTimeout(() => {
    abort();
  }, 10000);
}
