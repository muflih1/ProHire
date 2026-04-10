import {AppSidebar} from '@/components/app-sidebar';
import {SidebarNavMenuGroup} from '@/components/sidebar-nav-menu-group';
import {SidebarUserButton} from '@/features/users/components/sidebar-user-button';
import {createFileRoute, Outlet} from '@tanstack/react-router';
import {
  BrainCircuitIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LogInIcon,
} from 'lucide-react';

export const Route = createFileRoute('/(job-seeker)/_layout')({
  component: JobSeekerLayout,
});

function JobSeekerLayout() {
  return (
    <AppSidebar
      content={
        <SidebarNavMenuGroup
          className='mt-auto'
          items={[
            {to: '/', icon: ClipboardListIcon, label: 'Job Board'},
            {to: '/ai-search', icon: BrainCircuitIcon, label: 'Ai Search'},
            {
              to: '/employer',
              icon: LayoutDashboardIcon,
              label: 'Employer Dashboard',
              authState: 'SIGNED_IN',
            },
            {
              to: '/sign-in',
              icon: LogInIcon,
              label: 'Sign In',
              authState: 'SIGNED_OUT',
            },
          ]}
        />
      }
      footerButton={<SidebarUserButton />}
    >
      <Outlet />
    </AppSidebar>
  );
}
