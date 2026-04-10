import {useUser} from '@/hooks/use-user';

export default function SignedOut({children}: {children: React.ReactNode}) {
  const {isLoading, isAuthenticated} = useUser();

  if (isLoading || isAuthenticated) return null;

  return children;
}
