import {
  useCurrentOrganization,
  type CheckAuthorizationParams,
} from '@/features/organizations/hooks/use-current-organization';
import type React from 'react';

type Props = {children: React.ReactNode} & CheckAuthorizationParams;

export function Has({children, ...authorizationParams}: Props) {
  const {has} = useCurrentOrganization();

  if (!has(authorizationParams)) return null;

  return children;
}
