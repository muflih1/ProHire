import { useAuth } from '@/providers/auth-provider';
import { Navigate, Outlet, useLocation } from 'react-router';

type Props = {
  requireAuth?: boolean;
  redirectURL?: string;
};

export default function ProtectedRoute({
  requireAuth = true,
  redirectURL = '/',
}: Props) {
  const location = useLocation();
  const auth = useAuth();

  const isLoggedIn = auth != null && auth.id != null;

  const shouldRedirect = requireAuth ? !isLoggedIn : isLoggedIn;

  if (shouldRedirect) {
    return (
      <Navigate
        to={redirectURL}
        replace
        {...(requireAuth
          ? { state: { from: location.pathname + location.search } }
          : {})}
      />
    );
  }

  return <Outlet />;
}
