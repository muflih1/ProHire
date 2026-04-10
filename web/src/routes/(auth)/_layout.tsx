import {createFileRoute, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)/_layout')({
  beforeLoad: ({context}) => {
    if (context.session) {
      throw Route.redirect({to: '/', replace: true});
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className='flex flex-col h-screen w-full items-center justify-center'>
      <Outlet />
    </div>
  );
}
