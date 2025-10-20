import SignedIn from '@/components/signed-in';
import SignedOut from '@/components/signed-out';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useTRPC } from '@/utils/trpc';
import { AvatarImage } from '@radix-ui/react-avatar';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LogInIcon } from 'lucide-react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link } from 'react-router';
import { DateTime } from 'luxon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import JobListingBadges from '@/components/job-listing-badges';

export default function Home() {
  return (
    <SidebarProvider className='overflow-hidden'>
      <Sidebar collapsible='icon' className='overflow-hidden'>
        <SidebarHeader className='flex-row'>
          <SidebarTrigger />
          <span className='text-xl'>ProHire</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SignedOut>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to={'/login'}>
                      <LogInIcon />
                      <span>Log in</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SignedOut>
              <SignedIn>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to={'/employers'}>Post job</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SignedIn>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SignedIn>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Muflih</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </SignedIn>
      </Sidebar>
      <main className='flex-1'>
        <Suspense fallback='Loading...'>
          <ErrorBoundary fallback='Failed to fetch job listings'>
            <JobListingListItemsImpl />
          </ErrorBoundary>
        </Suspense>
      </main>
    </SidebarProvider>
  );
}

function JobListingListItemsImpl() {
  const trpc = useTRPC();
  const { data: jobListings } = useSuspenseQuery(
    trpc.getJobListingList.queryOptions()
  );

  if (jobListings.length === 0) {
    return 'No job listings found.';
  }

  return (
    <div className='space-y-4'>
      <TooltipProvider>
        {jobListings.map(jobListing => (
          <Link
            to={`/job-listings/${jobListing.id}`}
            className='block'
            key={jobListing.id}
          >
            <Card className='@container'>
              <CardHeader>
                <div className='flex gap-4'>
                  <Avatar className='size-14 @max-sm:hidden'>
                    <AvatarImage
                      src={jobListing.organization?.imageURL ?? undefined}
                      alt={jobListing.organization?.name}
                    />
                    <AvatarFallback className='uppercase bg-primary text-primary-foreground font-medium'>
                      {jobListing.organization?.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col gap-1'>
                    <CardTitle className='text-xl'>
                      {jobListing.title}
                    </CardTitle>
                    <CardDescription className='text-base'>
                      {jobListing.organization?.name}
                    </CardDescription>
                    {jobListing.postedAt != null && (
                      <div className='@max-md:hidden'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='text-sm font-medium text-primary'>
                              {DateTime.fromJSDate(
                                jobListing.postedAt
                              ).toRelative()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {DateTime.fromJSDate(jobListing.postedAt).toFormat(
                              "cccc, LLLL d, yyyy 'at' t"
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex flex-wrap gap-2'>
                <JobListingBadges jobListing={jobListing} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </TooltipProvider>
    </div>
  );
}
