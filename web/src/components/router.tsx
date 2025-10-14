import { Route, Routes } from 'react-router';
import ProtectedRoute from './protected-route';
import { lazy, Suspense } from 'react';
import { CurrentOrganizationIDProvider } from '@/providers/current-organization-id-provider';
import ProtectedEmployerRouteGuard from './protected-employer-route-guard';
import { ActiveOrganizationProvider } from '@/providers/active-organization-provider';

const Home = lazy(() => import('@/routes/home'));
const Login = lazy(() => import('@/routes/login'));
const Signup = lazy(() => import('@/routes/signup'));
const Employer = lazy(() => import('@/routes/employer'));
const Posting = lazy(() => import('@/routes/employer/posting'));

export default function Router() {
  return (
    <Suspense fallback='Page loading...'>
      <Routes>
        <Route element={<ProtectedRoute requireAuth redirectURL='/login' />}>
          <Route index element={<Home />} />
          <Route
            path='/employer'
            element={
              <CurrentOrganizationIDProvider readonly>
                <ActiveOrganizationProvider>
                  <ProtectedEmployerRouteGuard />
                </ActiveOrganizationProvider>
              </CurrentOrganizationIDProvider>
            }
          >
            <Route index element={<Employer />} />
            <Route path='posting' element={<Posting />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute requireAuth={false} redirectURL='/' />}>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
