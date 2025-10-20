import { useAuth } from '@/providers/auth-provider';
import React from 'react';

export default function SignedOut({ children }: React.PropsWithChildren) {
  const user = useAuth();

  if (user != null && user.id != null) return null;

  return children;
}
