import {CheckAuthorizationParams, useCurrentOrganization} from '@/features/organizations/hooks/use-current-organization';
import type React from 'react';
import {type LinkProps, Navigate} from '@tanstack/react-router';

type Permission =
  | 'org:profile:manage'
  | 'org:profile:read'
  | 'org:profile:delete'
  | 'org:billing:read'
  | 'org:billing:manage'
  | 'org:memberships:read'
  | 'org:memberships:write'
  | 'org:memberships:delete'
  | 'org:memberships:invite'
  | 'org:job_listing:read'
  | 'org:job_listing:write'
  | 'org:job_listing:delete'
  | 'org:job_listing:update'
  | 'org:job_listing:change_status'
  | 'org:job_listing_application:read'
  | 'org:job_listing_application:change_status'
  | 'org:job_listing_application:change_rating';

type RequirePermissionProps = {
  redirectProps: LinkProps;
  children: React.ReactNode;
} & CheckAuthorizationParams;

export function RequireAuthorization({
  redirectProps,
  children,
  ...authorizationParams
}: RequirePermissionProps) {
  const {has} = useCurrentOrganization();

  if (!has(authorizationParams)) {
    return (
      <Navigate
        {...redirectProps}
        to={redirectProps?.to ?? '/employer'}
      />
    );
  }

  return <>{children}</>;
}
