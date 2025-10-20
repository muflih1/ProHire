import React, { createContext, Suspense, useContext } from 'react';
import { useCurrentOrganizationID } from './current-organization-id-provider';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

type ContextValueType = {
  id: bigint;
  name: string;
  imageURL: string | null;
  role: {
    id: bigint;
    name: string;
    permissions: string[];
  };
};

const ActiveOrganizationContext = createContext<ContextValueType | null>(null);

type Props = {
  children?: React.ReactNode;
};

export function ActiveOrganizationProvider(props: Props) {
  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch active organization.'>
        <ActiveOrganizationProviderImpl {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

function ActiveOrganizationProviderImpl(props: Props) {
  const organizationID = useCurrentOrganizationID().read()!;
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.getActiveOrganization.queryOptions({ organizationID })
  );

  return (
    <ActiveOrganizationContext.Provider value={data}>
      {props.children}
    </ActiveOrganizationContext.Provider>
  );
}

export function useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE() {
  const ctx = useContext(ActiveOrganizationContext);
  if (ctx == null) {
    throw new Error(
      'useActiveOrganization must be inside <ActiveOrganizationProvider />'
    );
  }
  return ctx;
}
