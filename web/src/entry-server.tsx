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
import path from 'path';
import fs from "fs/promises"

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
      {'__VITE_STREAMING_END__'}
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

        const marker = '__VITE_STREAMING_END__';

        const transformStream = new Transform({
          transform(chunk, _encoding, callback) {
            let html = chunk.toString();
            const markerIndex = html.indexOf(marker);

            if (markerIndex !== -1 && !htmlEnded) {
              const beforeMarker = html.slice(0, markerIndex);
              res.write(
                beforeMarker +
                  htmlEnd.replace(`<!--preloaded-state-->`, preloadedState),
                'utf-8'
              );
              htmlEnded = true;
            } else if (!htmlEnded) {
              res.write(html, 'utf-8');
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
