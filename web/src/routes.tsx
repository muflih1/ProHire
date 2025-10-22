import { createRoutesFromElements, Route } from 'react-router';
import ProtectedRoute from './components/protected-route';
import Home from './routes/(seeker)/home';
import Login from './routes/(auth)/login';
import Signup from './routes/(auth)/signup';

export const routes = createRoutesFromElements(
  <>
    <Route element={<ProtectedRoute requireAuth redirectURL='/login' />}>
      <Route index element={<Home />} />
    </Route>
    <Route element={<ProtectedRoute requireAuth={false} redirectURL='/' />}>
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
    </Route>
  </>
);
