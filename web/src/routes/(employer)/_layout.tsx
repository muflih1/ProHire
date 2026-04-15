import {AppSidebar} from '@/components/app-sidebar';
import {Has} from '@/components/has';
import {SidebarNavMenuGroup} from '@/components/sidebar-nav-menu-group';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {JobListingStatus} from '@/constants/job-listing';
import {formatJobStatus} from '@/features/job-listings/lib/formatters';
import {sortJobListingsByStatus} from '@/features/job-listings/lib/utils';
import {SidebarOrganizationButton} from '@/features/organizations/components/sidebar-organization-button';
import {useCurrentOrganization} from '@/features/organizations/hooks/use-current-organization';
import {useTRPC} from '@/utils/trpc';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Outlet, useParams} from '@tanstack/react-router';
import {createFileRoute} from '@tanstack/react-router';
import {
  ChevronRightIcon,
  ClipboardListIcon,
  PlusIcon,
} from 'lucide-react';

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
  loader: ({context}) => {
    void context.queryClient.prefetchQuery(
      context.trpc.jobListings.list.queryOptions(),
    );
  },
});

function EmployerLayout() {
  return (
    <AppSidebar
      content={
        <>
          <SidebarGroup>
            <SidebarGroupLabel>Job Listings</SidebarGroupLabel>
            <Has permission='org:job_listing:write'>
              <SidebarGroupAction
                render={<Route.Link to='/employer/job-listings/new' />}
              >
                <PlusIcon /> <span className='sr-only'>Add Job Listing</span>
              </SidebarGroupAction>
            </Has>
            <SidebarGroupContent className='group-data-[state=collapsed]:hidden'>
              <JobListingsMenu />
            </SidebarGroupContent>
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

function JobListingsMenu() {
  const jobListingID = useParams({
    from: '/(employer)/_layout/employer/job-listings/$jobListingID/',
    select: p => p.jobListingID,
    shouldThrow: false,
  });
  const {has} = useCurrentOrganization();
  const trpc = useTRPC();

  const {data: jobListings} = useSuspenseQuery(
    trpc.jobListings.list.queryOptions(),
  );

  if (jobListings.length === 0 && has({permission: 'org:job_listing:write'})) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Route.Link to='/employer/job-listings/new' />}
          >
            <PlusIcon size={16} />
            <span>Create your first job listing</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return Object.entries(Object.groupBy(jobListings, jl => jl.status))
    .sort(([a], [b]) =>
      sortJobListingsByStatus(a as JobListingStatus, b as JobListingStatus),
    )
    .map(([status, jobListing]) => (
      <SidebarMenu key={status}>
        <Collapsible
          defaultOpen={
            status !== 'UNLISTED' ||
            jobListings.find(job => job.id.toString() === jobListingID) != null
          }
          className='group/collapsible'
        >
          <SidebarMenuItem>
            <CollapsibleTrigger render={<SidebarMenuButton />}>
              {formatJobStatus(status as JobListingStatus)}
              <ChevronRightIcon className='ml-auto transition-transform group-data-open/collapsible:rotate-90' />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {jobListings.map(jobListing => (
                  <JobListingMenuCell key={jobListing.id} {...jobListing} />
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    ));
}

function JobListingMenuCell({
  id,
  title,
  applicationCount,
}: {
  id: bigint;
  title: string;
  status: JobListingStatus;
  applicationCount: number;
}) {
  const jobListingID = useParams({
    from: '/(employer)/_layout/employer/job-listings/$jobListingID/',
    select: p => p.jobListingID,
    shouldThrow: false,
  });

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={jobListingID === id.toString()}
        render={
          <Route.Link
            to='/employer/job-listings/$jobListingID'
            params={{jobListingID: id.toString()}}
          />
        }
      >
        <span className='truncate'>{title}</span>
      </SidebarMenuSubButton>
      {applicationCount > 0 && (
        <div className='absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
          {applicationCount}
        </div>
      )}
    </SidebarMenuSubItem>
  );
}
