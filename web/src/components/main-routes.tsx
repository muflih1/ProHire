import { Outlet, Route, Routes } from 'react-router';
import ProtectedRoute from './protected-route';
import { lazy, Suspense } from 'react';
import SeekerRootLayout from './seeker-root-layout';

const Home = lazy(() => import('@/routes/home'));
const ViewJob = lazy(() => import('@/routes/viewjob'));
const Login = lazy(() => import('@/routes/login'));
const Signup = lazy(() => import('@/routes/signup'));
const EmployerRootLayout = lazy(() => import('./employer-root-layout'));
const Employer = lazy(() => import('@/routes/employers'));
const Posting = lazy(() => import('@/routes/employers/posting'));
const JobListing = lazy(() => import('@/routes/employers/job-listings'));
const JobListingEditing = lazy(() => import('@/routes/employers/editing'));
const Pricing = lazy(() => import('@/routes/employers/pricing'));

export default function MainRoutes() {
  return (
    <Suspense fallback='Page loading...'>
      <Routes>
        <Route element={<SeekerRootLayout />}>
          <Route index element={<Home />} />
          <Route path='viewjob/:jobListingID' element={<ViewJob />} />
        </Route>
        <Route element={<ProtectedRoute requireAuth redirectURL='/login' />}>
          <Route path='/employers' element={<EmployerRootLayout />}>
            <Route index element={<Employer />} />
            <Route path='posting' element={<Posting />} />
            <Route path='pricing' element={<Pricing />} />
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
