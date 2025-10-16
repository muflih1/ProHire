import { Outlet, Route, Routes } from 'react-router';
import ProtectedRoute from './protected-route';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('@/routes/home'));
const Login = lazy(() => import('@/routes/login'));
const Signup = lazy(() => import('@/routes/signup'));
const EmployerRootLayout = lazy(() => import('./employer-root-layout'));
const Employer = lazy(() => import('@/routes/employer'));
const Posting = lazy(() => import('@/routes/employer/posting'));
const JobListing = lazy(() => import('@/routes/employer/job-listings'));
const JobListingEditing = lazy(() => import('@/routes/employer/editing'));

export default function MainRoutes() {
  return (
    <Suspense fallback='Page loading...'>
      <Routes>
        <Route element={<ProtectedRoute requireAuth redirectURL='/login' />}>
          <Route index element={<Home />} />
          <Route path='/employer' element={<EmployerRootLayout />}>
            <Route index element={<Employer />} />
            <Route path='posting' element={<Posting />} />
            <Route path='job-listings/:jobListingID' element={<Outlet />}>
              <Route index element={<JobListing />} />
              <Route path='editing' element={<JobListingEditing />} />
            </Route>
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
