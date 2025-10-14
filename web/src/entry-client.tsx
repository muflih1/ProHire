import './index.css';
import { StrictMode, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { TRPCProvider } from './providers/trpc-provider';
import { AuthProvider } from './providers/auth-provider';
import App from './App';
import { Toaster } from './components/ui/sonner';
import { type DehydratedState } from '@tanstack/react-query';
import superjson, { type SuperJSONResult } from 'superjson';

const preloadedState =
  window.__PRELOADED_STATE__ != null
    ? superjson.deserialize(window.__PRELOADED_STATE__)
    : undefined;

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <TRPCProvider
      dehydratedState={preloadedState as DehydratedState | undefined}
    >
      <BrowserRouter>
        <Suspense fallback='Loading...'>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </Suspense>
      </BrowserRouter>
    </TRPCProvider>
  </StrictMode>
);

declare global {
  interface Window {
    __PRELOADED_STATE__?: SuperJSONResult;
  }
}

queueMicrotask(() => {
  console.log('Hello, World!')
})
