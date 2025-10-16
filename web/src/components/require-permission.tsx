import usePermission from '@/hooks/use-permission';
import React from 'react';
import { Navigate } from 'react-router';

type RequirePermissionProps = {
  permission: string;
  redirectURL?: string;
  children: React.ReactNode;
};

export default function RequirePerssion({
  permission,
  redirectURL = '/employer',
  children,
}: RequirePermissionProps) {
  const has = usePermission();

  if (!has(permission)) {
    return <Navigate to={redirectURL} replace />;
  }

  return <>{children}</>;
}
