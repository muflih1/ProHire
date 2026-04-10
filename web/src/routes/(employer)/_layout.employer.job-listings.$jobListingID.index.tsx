import {Has} from '@/components/has';
import {If} from '@/components/if';
import JobListingBadges from '@/components/job-listing-badges';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {JobListingStatus} from '@/constants/job-listing';
import {formatJobStatus} from '@/features/job-listings/lib/formatters';
import {getNextJobListingStatus} from '@/features/job-listings/lib/utils';
import {useCurrentOrganization} from '@/features/organizations/hooks/use-current-organization';
import {useTRPC} from '@/utils/trpc';
import {useQuery, useSuspenseQuery} from '@tanstack/react-query';
import {createFileRoute, Link} from '@tanstack/react-router';
import {EditIcon, EyeIcon, EyeOffIcon} from 'lucide-react';
import Markdown from 'react-markdown';

export const Route = createFileRoute(
  '/(employer)/_layout/employer/job-listings/$jobListingID/',
)({
  component: JobListingRoute,
  loader: ({context, params}) => {
    void context.queryClient.prefetchQuery(
      context.trpc.jobListings.get.queryOptions({
        jobListingID: params.jobListingID,
      }),
    );
  },
});

function JobListingRoute() {
  const jobListingID = Route.useParams({select: params => params.jobListingID});
  const trpc = useTRPC();
  const {data: jobListing} = useSuspenseQuery(
    trpc.jobListings.get.queryOptions({jobListingID}),
  );

  if (!jobListing) return '404 Not found';

  return (
    <div className='space-y-6 max-w-6xl mx-auto p-4 @container'>
      <div className='flex items-center justify-between gap-4 @max-4xl:flex-col @max-4xl:items-start'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {jobListing.title}
          </h1>
          <div className='flex flex-wrap gap-2 mt-2'>
            <Badge>
              {formatJobStatus(jobListing.status as JobListingStatus)}
            </Badge>
            <JobListingBadges jobListing={jobListing} />
          </div>
        </div>
        <div className='flex items-center gap-2 empty:contents'>
          <Has permission='org:job_listing:update'>
            <Button
              variant={'outline'}
              render={
                <Link
                  to='/employer/job-listings/$jobListingID/edit'
                  params={{jobListingID: jobListing.id.toString()}}
                />
              }
              nativeButton={false}
            >
              <EditIcon size={16} />
              Edit
            </Button>
          </Has>
          <StatusUpdateButton status={jobListing.status as JobListingStatus} />
          {/* {has(PERMISSIONS.ORG_JOB_LISTING_CHANGE_STATUS) && (
            <UpdateJobListingStatusButton
              status={jobListing.status as JobListingStatus}
              id={jobListing.id.toString()}
            />
          )}
          {has(PERMISSIONS.ORG_JOB_LISTING_DELETE) && (
            <DeleteJobListingButton jobListingID={jobListing.id} />
          )}  */}
        </div>
      </div>
      <div className='prose dark:prose-invert'>
        <Markdown>{jobListing.description}</Markdown>
      </div>
    </div>
  );
}

function StatusUpdateButton({status}: {status: JobListingStatus}) {
  const {has} = useCurrentOrganization();
  const isMaxed = useHasReachedMaxJobListings();
  const button = <Button variant='outline'>Toggle</Button>;

  return (
    <If condition={has({permission: 'org:job_listing:change_status'})}>
      {getNextJobListingStatus(status) === 'PUBLISHED' ? (
        <If
          condition={!isMaxed}
          otherwise={
            <Popover>
              <PopoverTrigger render={<Button variant='outline' />}>
                {statusToggleButtonText(status)}
              </PopoverTrigger>
              <PopoverContent className='flex flex-col gap-2'>
                You must upgrade your plan to publish more job listings.
                <Button
                  render={<Route.Link to='/employer/pricing' />}
                  nativeButton={false}
                >
                  Upgrade Plan
                </Button>
              </PopoverContent>
            </Popover>
          }
        >
          {button}
        </If>
      ) : (
        button
      )}
    </If>
  );
}

function useHasReachedMaxJobListings() {
  const {has} = useCurrentOrganization();
  const trpc = useTRPC();

  const {data} = useQuery(trpc.jobListings.getPublishedCount.queryOptions());

  if (data == null) return false;

  return !(
    (has({feature: 'post_1_job_listing'}) && data.count < 1) ||
    (has({feature: 'post_3_job_listings'}) && data.count < 3) ||
    has({feature: 'post_unlimited_job_listings'})
  );
}

function statusToggleButtonText(status: JobListingStatus) {
  switch (status) {
    case 'UNLISTED':
    case 'DRAFT':
      return (
        <>
          <EyeIcon size={16} />
          Publish
        </>
      );
    case 'PUBLISHED':
      return (
        <>
          <EyeOffIcon size={16} />
          Unlist
        </>
      );
    default:
      throw new Error(`Unkown status: ${status satisfies never}`);
  }
}

// type UpdateJobListingStatusButtonProps = {
//   status: JobListingStatus;
//   id: string;
// };

// function UpdateJobListingStatusButton(
//   props: UpdateJobListingStatusButtonProps
// ) {
//   return (
//     <Suspense fallback='Loading...'>
//       <ErrorBoundary fallback='Failed to fetch posted job listings count'>
//         <UpdateJobListingStatusButtonImpl {...props} />
//       </ErrorBoundary>
//     </Suspense>
//   );
// }

// function UpdateJobListingStatusButtonImpl(
//   props: UpdateJobListingStatusButtonProps
// ) {
//   const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
//   const trpc = useTRPC();
//   const { data } = useSuspenseQuery(
//     trpc.getPublishedJobListingsCount.queryOptions({
//       organizationID: organization.id.toString(),
//     })
//   );
//   const has = useHasFeature();

//   if (
//     getNextJobListingStatus(props.status) === 'PUBLISHED' &&
//     !((has(PLAN_FEATURES.POST_1_JOB_LISTING) && data.count < 1) ||
//       (has(PLAN_FEATURES.POST_3_JOB_LISTING) && data.count < 3) ||
//       (has(PLAN_FEATURES.POST_15_JOB_LISTING) && data.count < 15))
//   ) {
//     return (
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant={'outline'}>
//             {getJobListingStatusToggleButtonText(props.status)}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className='flex flex-col gap-2'>
//           You must upgrade your plan to publish more job listings.
//           <Button asChild>
//             <Link to={'/employers/pricing'}>Upgrade plan</Link>
//           </Button>
//         </PopoverContent>
//       </Popover>
//     );
//   }

//   return <JobListingStatusToggleButton {...props} />;
// }

// function JobListingStatusToggleButton({
//   id,
//   status,
// }: UpdateJobListingStatusButtonProps) {
//   const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
//   const queryClient = useQueryClient();
//   const trpc = useTRPC();
//   const { mutate, isPending } = useMutation(
//     trpc.updateJobListingStatus.mutationOptions({
//       onSuccess: () => {
//         queryClient.invalidateQueries({
//           queryKey: trpc.getJobListingByID.queryKey(),
//         });
//       },
//     })
//   );
//   const [Dialog, confirm] = useConfirm(
//     'Are you sure?',
//     'This will immediately show this job listing to all users.'
//   );

//   return (
//     <>
//       <Button
//         disabled={isPending}
//         variant={'outline'}
//         onClick={async () => {
//           if (
//             getNextJobListingStatus(status) === 'PUBLISHED' &&
//             !(await confirm())
//           )
//             return;

//           mutate({
//             jobLisstingID: id,
//             newStatus: getNextJobListingStatus(status),
//             organizationID: organization.id.toString(),
//           });
//         }}
//       >
//         {isPending ? <Spinner /> : getJobListingStatusToggleButtonText(status)}
//       </Button>
//       <Dialog />
//     </>
//   );
// }
