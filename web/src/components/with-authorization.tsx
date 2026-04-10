import {RequireAuthorization} from './require-authorization';
import type React from 'react';
import type {LinkProps} from '@tanstack/react-router';
import type {CheckAuthorizationParams} from '@/features/organizations/hooks/use-current-organization';

export function withAuthorization<P extends object>(
  Component: React.ComponentType<P>,
  redirectProps: LinkProps,
  authorizationParams: CheckAuthorizationParams,
) {
  return (props: P) => (
    <RequireAuthorization
      {...authorizationParams}
      redirectProps={{
        ...redirectProps,
        to: redirectProps?.to ?? '/employer',
      }}
    >
      <Component {...props} />
    </RequireAuthorization>
  );
}
