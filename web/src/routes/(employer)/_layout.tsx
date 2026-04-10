import {AppSidebar} from '@/components/app-sidebar';
import {SidebarNavMenuGroup} from '@/components/sidebar-nav-menu-group';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import {SidebarOrganizationButton} from '@/features/organizations/components/sidebar-organization-button';
import {Outlet} from '@tanstack/react-router';
import {createFileRoute} from '@tanstack/react-router';
import {ClipboardListIcon, PlusIcon} from 'lucide-react';

export const Route = createFileRoute('/(employer)/_layout')({
  beforeLoad: async ({context}) => {
    if (!context.session) {
      throw Route.redirect({
        to: '/sign-in',
        replace: true,
        search: {continue: '/employer'},
      });
    }
    if (context.session.activeOrganizationID == null) {
      throw Route.redirect({to: '/organization-switcher', replace: true});
    }

    await context.queryClient.prefetchQuery(
      context.trpc.organizations.active.queryOptions(undefined, {
        staleTime: Infinity,
        refetchOnMount: false,
        retry: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      }),
    );
  },
  component: EmployerLayout,
});

function EmployerLayout() {
  return (
    <AppSidebar
      content={
        <>
          <SidebarGroup>
            <SidebarGroupLabel>Job Listings</SidebarGroupLabel>
            <SidebarGroupAction
              render={<Route.Link to='/employer/job-listings/new' />}
            >
              <PlusIcon /> <span className='sr-only'>Add Job Listing</span>
            </SidebarGroupAction>
            <SidebarMenu></SidebarMenu>
          </SidebarGroup>
          <SidebarNavMenuGroup
            className='mt-auto'
            items={[{to: '/', icon: ClipboardListIcon, label: 'Job Board'}]}
          />
        </>
      }
      footerButton={<SidebarOrganizationButton />}
    >
      <Outlet />
    </AppSidebar>
  );
}
