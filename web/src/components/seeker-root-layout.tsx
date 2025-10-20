import { Outlet } from 'react-router';
import Header from './header';

export default function SeekerRootLayout() {
  return (
    <div>
      <Header />
      <main className='mt-6 max-w-5xl mx-auto'>
        <Outlet />
      </main>
    </div>
  );
}
