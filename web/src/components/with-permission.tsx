import React from 'react';
import RequirePerssion from './require-permission';

export default function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  redirectURL = '/employer'
) {
  return (props: P) => (
    <RequirePerssion permission={permission} redirectURL={redirectURL}>
      <Component {...props} />
    </RequirePerssion>
  );
}
