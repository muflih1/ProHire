import type React from 'react';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

function useViewerQuery() {
  const trpc = useTRPC();
  const viewerQuery = useSuspenseQuery(trpc.viewer.queryOptions());

  return viewerQuery;
}

const AuthContext = createContext<null | ReturnType<typeof useViewerQuery>>(
  null
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useViewerQuery();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
