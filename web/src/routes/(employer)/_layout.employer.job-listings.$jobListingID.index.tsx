import {Has} from '@/components/has';
import {If} from '@/components/if';
import JobListingBadges from '@/components/job-listing-badges';
import {LoadingSwap} from '@/components/loading-swap';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Flexbox} from '@/components/ui/flexbox';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {JobListingStatus} from '@/constants/job-listing';
import {formatJobStatus} from '@/features/job-listings/lib/formatters';
import {getNextJobListingStatus} from '@/features/job-listings/lib/utils';
import {useCurrentOrganization} from '@/features/organizations/hooks/use-current-organization';
import useConfirm from '@/hooks/use-confirm';
import {useTRPC} from '@/utils/trpc';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from 'lucide-react';
import React from 'react';
import Markdown from 'react-markdown';
import {toast} from 'sonner';

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
  const navigate = useNavigate();
  const [ConfirmationDialog, confirm] = useConfirm(
    'Are you sure?',
    'This will permanently delete the job listing and cannot be undone.',
  );
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {data: jobListing} = useSuspenseQuery(
    trpc.jobListings.get.queryOptions({jobListingID}),
  );

  const {mutate: deleteJobListingMutationSync, isPending} = useMutation(
    trpc.jobListings.delete.mutationOptions({
      onSuccess: () => {
        queryClient.removeQueries(
          trpc.jobListings.get.queryOptions({jobListingID}),
        );
        navigate({to: '/employer', replace: true});
      },
      onError: error => {
        toast.error(error.message);
      },
    }),
  );

  if (!jobListing) return '404 Not found';

  return (
    <>
      <div className='space-y-6 max-w-6xl mx-auto p-4 @container'>
        <Flexbox
          alignItems='center'
          justifyContent='between'
          gap={4}
          className='@max-4xl:flex-col @max-4xl:items-start'
        >
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {jobListing.title}
            </h1>
            <Flexbox wrap='wrap' gap={2} className='mt-2'>
              <Badge>
                {formatJobStatus(jobListing.status as JobListingStatus)}
              </Badge>
              <JobListingBadges jobListing={jobListing} />
            </Flexbox>
          </div>
          <Flexbox alignItems='center' gap={2} className='empty:contents'>
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
            <StatusUpdateButton
              status={jobListing.status as JobListingStatus}
              id={jobListing.id}
            />
            {jobListing.status === 'PUBLISHED' && (
              <FeaturedToggleButton
                isFeatured={jobListing.isFeatured}
                id={jobListing.id}
              />
            )}
            <Button
              variant='destructive'
              onClick={async () => {
                if (!(await confirm())) return;
                deleteJobListingMutationSync({id: jobListing.id});
              }}
            >
              <LoadingSwap
                isLoading={isPending}
                className='flex items-center gap-1.5'
              >
                <Trash2Icon size={16} />
                Delete
              </LoadingSwap>
            </Button>
            {/*
          {has(PERMISSIONS.ORG_JOB_LISTING_DELETE) && (
            <DeleteJobListingButton jobListingID={jobListing.id} />
            )}  */}
          </Flexbox>
        </Flexbox>
        <div className='prose dark:prose-invert'>
          <Markdown>{jobListing.description}</Markdown>
        </div>
      </div>
      <ConfirmationDialog actionButtonProps={{variant: 'destructive'}} />
    </>
  );
}

function StatusUpdateButton({
  status,
  id,
}: {
  status: JobListingStatus;
  id: bigint;
}) {
  const {has} = useCurrentOrganization();
  const isMaxed = useReachedMaxPublishedJobListings();
  const [ConfirmationDialog, confirm] = useConfirm(
    'Are you sure?',
    'This will immediately show this job listing to all users.',
  );
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {mutate: toggleJobListingStatusMutationSync, isPending} = useMutation(
    trpc.jobListings.toggleStatus.mutationOptions({
      onError: error => {
        toast.error(error.message);
      },
      onSuccess: data => {
        if (data.ok) {
          queryClient.setQueryData(
            trpc.jobListings.get.queryKey({jobListingID: id.toString()}),
            jobListing => {
              if (!jobListing) return jobListing;
              return {...jobListing, status: data.status as JobListingStatus};
            },
          );
        }
      },
    }),
  );

  const button = (
    <Button
      variant='outline'
      onClick={async () => {
        if (getNextJobListingStatus(status) === 'PUBLISHED') {
          const ok = await confirm();
          if (!ok) return;
          toggleJobListingStatusMutationSync({jobListingID: id});
        } else {
          toggleJobListingStatusMutationSync({jobListingID: id});
        }
      }}
    >
      <LoadingSwap isLoading={isPending} className='flex items-center gap-2'>
        {statusToggleButtonText(status)}
      </LoadingSwap>
    </Button>
  );

  return (
    <>
      <If condition={has({permission: 'org:job_listing:change_status'})}>
        {getNextJobListingStatus(status) === 'PUBLISHED' ? (
          <If
            condition={!isMaxed}
            otherwise={
              <UpgradePlanPopover
                triggerLabel={status}
                popoverContent='You must upgrade your plan to publish more job listings.'
              />
            }
          >
            {button}
          </If>
        ) : (
          button
        )}
      </If>
      <ConfirmationDialog />
    </>
  );
}

function FeaturedToggleButton({
  isFeatured,
  id,
}: {
  isFeatured: boolean;
  id: bigint;
}) {
  const {has} = useCurrentOrganization();
  const isMaxed = useReachedMaxFeaturedJobListings();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {mutate: toggleJobListingFeaturedMutationSync, isPending} = useMutation(
    trpc.jobListings.toggleFeatured.mutationOptions({
      onError: error => {
        toast.error(error.message);
      },
      onSuccess: data => {
        if (data.ok) {
          queryClient.setQueryData(
            trpc.jobListings.get.queryKey({jobListingID: id.toString()}),
            jobListing => {
              if (!jobListing) return jobListing;
              return {...jobListing, isFeatured: data.isFeatured};
            },
          );
        }
      },
    }),
  );

  const button = (
    <Button
      variant='outline'
      onClick={() => toggleJobListingFeaturedMutationSync({jobListingID: id})}
    >
      <LoadingSwap isLoading={isPending} className='flex items-center gap-2'>
        {featuredToggleButtonText(isFeatured)}
      </LoadingSwap>
    </Button>
  );

  return (
    <If condition={has({permission: 'org:job_listing:change_status'})}>
      {isFeatured ? (
        button
      ) : (
        <If
          condition={!isMaxed}
          otherwise={
            <UpgradePlanPopover
              triggerLabel={featuredToggleButtonText(isFeatured)}
              popoverContent='You must upgrade your plan to feature more job listings.'
            />
          }
        >
          {button}
        </If>
      )}
    </If>
  );
}

function UpgradePlanPopover({
  triggerLabel,
  popoverContent,
}: {
  triggerLabel: React.ReactNode;
  popoverContent: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent className='flex flex-col gap-2'>
        {popoverContent}
        <Button
          render={<Route.Link to='/employer/pricing' />}
          nativeButton={false}
        >
          Upgrade Plan
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function useReachedMaxFeaturedJobListings() {
  const {has} = useCurrentOrganization();
  const trpc = useTRPC();

  const {data} = useQuery(trpc.jobListings.getFeaturedCount.queryOptions());

  if (data == null) return false;

  return !(
    (has({feature: '1_featured_job_listing'}) && data.count < 1) ||
    has({feature: 'unlimited_featured_job_listings'})
  );
}

function useReachedMaxPublishedJobListings() {
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

function featuredToggleButtonText(isFeatured: boolean) {
  return isFeatured ? (
    <>
      <StarOffIcon size={16} />
      Un Feature
    </>
  ) : (
    <>
      <StarIcon size={16} />
      Feature
    </>
  );
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
