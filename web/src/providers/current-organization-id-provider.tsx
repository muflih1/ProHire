import { createContext, useContext, useMemo, useState } from 'react';
import Cookie from 'js-cookie';

function makeError(operation: string) {
  return () => {
    throw new Error(
      `You are ${operation} the Current OrganizationID from a React component that is not a descendant of <CurrentOrganizationIDProvider />`
    );
  };
}

type CurrentOrganizationIDContextValue = {
  read: () => string | undefined;
  write: (orgID: string) => void;
};

const CurrentOrganizationIDContext =
  createContext<CurrentOrganizationIDContextValue>({
    read: makeError('reading'),
    write: makeError('setting'),
  });

type CurrentOrganizationIDProviderProps = {
  children: React.ReactNode;
  initialOrganizationID?: string;
  readonly?: boolean;
};

export function CurrentOrganizationIDProvider({
  children,
  initialOrganizationID,
  readonly = false,
}: CurrentOrganizationIDProviderProps) {
  const [orgID, setOrgID] = useState<string | undefined>(() => {
    if (initialOrganizationID != null) return initialOrganizationID;
    return Cookie.get('c_org') ?? '0';
  });

  const value = useMemo<CurrentOrganizationIDContextValue>(
    () => ({
      read: () => orgID,
      write: (orgID: string) => {
        if (readonly) {
          throw new Error(
            'You tried to update Current OrganizationID, but the <CurrentOrganizationIDProvider /> closest to your useCurrentOrganizationID() call has a read-only OrganizationID. To fix this, wrap the React tree that you want to set an Current OrganizationID for with your own <CurrentOrganizationIDProvider />.'
          );
        }
        setOrgID(orgID);
        Cookie.set('c_org', orgID, {
          path: '/',
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });
      },
    }),
    [orgID, readonly]
  );

  return (
    <CurrentOrganizationIDContext.Provider value={value}>
      {children}
    </CurrentOrganizationIDContext.Provider>
  );
}

export function useCurrentOrganizationID() {
  return useContext(CurrentOrganizationIDContext);
}
