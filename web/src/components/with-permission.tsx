import React from 'react';
import RequirePerssion from './require-permission';
import {LinkProps} from '@tanstack/react-router';

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

export default function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  redirectLinkProps: LinkProps,
) {
  return (props: P) => (
    <RequirePerssion
      permission={permission}
      redirectLinkProps={{
        ...redirectLinkProps,
        to: redirectLinkProps?.to ?? '/employer',
      }}
    >
      <Component {...props} />
    </RequirePerssion>
  );
}
