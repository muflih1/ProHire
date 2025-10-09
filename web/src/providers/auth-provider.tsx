import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import React, { createContext, useContext } from 'react';

function useViewerQuery() {
  const trpc = useTRPC();
  const viewerQuery = useSuspenseQuery(trpc.viewer.queryOptions());

  return viewerQuery
}

const AuthContext = createContext<null | ReturnType<typeof useViewerQuery>>(null);

export function AuthContextProvider({children}: {children: React.ReactNode}) {
  const value = useViewerQuery()
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx == null) {
    throw new Error('useAuth must be inside AuthContextProvider')
  }
  return ctx
}