import { useAuth } from '@/providers/auth-provider';
import React from 'react';

export default function SignedIn({ children }: React.PropsWithChildren) {
  const auth = useAuth();

  return auth?.data != null && auth?.data?.id != null ? <>{children}</> : null;
}
