import './index.css';
import { StrictMode, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { TRPCProvider } from './providers/trpc-provider';
import { AuthContextProvider } from './providers/auth-provider';
import App from './App';
import { Toaster } from './components/ui/sonner';

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <TRPCProvider dehydratedState={(window as any).__PRELOADED_STATE__}>
      <BrowserRouter>
        <Suspense fallback='Loading...'>
          <AuthContextProvider>
            <App />
            <Toaster />
          </AuthContextProvider>
        </Suspense>
      </BrowserRouter>
    </TRPCProvider>
  </StrictMode>
);
