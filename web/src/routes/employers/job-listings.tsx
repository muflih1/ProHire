import { Button } from '@/components/ui/button';
import withPermission from '@/components/with-permission';
import { PERMISSIONS } from '@/constants/permissions';
import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from '@/providers/active-organization-provider';
import { useTRPC } from '@/utils/trpc';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { EditIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link, useParams } from 'react-router';
import Markdown from 'react-markdown';
import usePermission from '@/hooks/use-permission';
import JobListingBadges from '@/components/job-listing-badges';
import { JobListingStatus } from '@/constants/job-listing';
import { formatJobStatus } from '@/utils/formatters/job-listing';
import { Badge } from '@/components/ui/badge';
import DeleteJobListingButton from '@/components/delete-job-listing-button';
import { PLAN_FEATURES } from '@/constants/plan-features';
import useHasFeature from '@/hooks/use-has-feature';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import useConfirm from '@/hooks/use-confirm';
import { Spinner } from '@/components/ui/spinner';

function JobListings() {
  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to get job listing'>
        <JobListingsImpl />
      </ErrorBoundary>
    </Suspense>
  );
}

function JobListingsImpl() {
  const params = useParams<{ jobListingID: string }>();
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const trpc = useTRPC();
  const has = usePermission();

  const { data: jobListing } = useSuspenseQuery(
    trpc.getJobListingByID.queryOptions({
      jobListingID: params.jobListingID!,
      organizationID: organization.id.toString(),
    })
  );

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
          {has(PERMISSIONS.ORG_JOB_LISTING_UPDATE) && (
            <Button asChild variant={'outline'}>
              <Link to={`/employers/job-listings/${jobListing.id}/editing`}>
                <EditIcon className='size-4' />
                Edit
              </Link>
            </Button>
          )}
          {has(PERMISSIONS.ORG_JOB_LISTING_CHANGE_STATUS) && (
            <UpdateJobListingStatusButton
              status={jobListing.status as JobListingStatus}
              id={jobListing.id.toString()}
            />
          )}
          {has(PERMISSIONS.ORG_JOB_LISTING_DELETE) && (
            <DeleteJobListingButton jobListingID={jobListing.id} />
          )}
        </div>
      </div>
      <div className='prose'>
        <Markdown>{jobListing.description}</Markdown>
      </div>
    </div>
  );
}

type UpdateJobListingStatusButtonProps = {
  status: JobListingStatus;
  id: string;
};

function UpdateJobListingStatusButton(
  props: UpdateJobListingStatusButtonProps
) {
  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch posted job listings count'>
        <UpdateJobListingStatusButtonImpl {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

function UpdateJobListingStatusButtonImpl(
  props: UpdateJobListingStatusButtonProps
) {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.getPublishedJobListingsCount.queryOptions({
      organizationID: organization.id.toString(),
    })
  );
  const has = useHasFeature();

  if (
    getNextJobListingStatus(props.status) === 'PUBLISHED' &&
    !((has(PLAN_FEATURES.POST_1_JOB_LISTING) && data.count < 1) ||
      (has(PLAN_FEATURES.POST_3_JOB_LISTING) && data.count < 3) ||
      (has(PLAN_FEATURES.POST_15_JOB_LISTING) && data.count < 15))
  ) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={'outline'}>
            {getJobListingStatusToggleButtonText(props.status)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='flex flex-col gap-2'>
          You must upgrade your plan to publish more job listings.
          <Button asChild>
            <Link to={'/employers/pricing'}>Upgrade plan</Link>
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  return <JobListingStatusToggleButton {...props} />;
}

function JobListingStatusToggleButton({
  id,
  status,
}: UpdateJobListingStatusButtonProps) {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutate, isPending } = useMutation(
    trpc.updateJobListingStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.getJobListingByID.queryKey(),
        });
      },
    })
  );
  const [Dialog, confirm] = useConfirm(
    'Are you sure?',
    'This will immediately show this job listing to all users.'
  );

  return (
    <>
      <Button
        disabled={isPending}
        variant={'outline'}
        onClick={async () => {
          if (
            getNextJobListingStatus(status) === 'PUBLISHED' &&
            !(await confirm())
          )
            return;

          mutate({
            jobLisstingID: id,
            newStatus: getNextJobListingStatus(status),
            organizationID: organization.id.toString(),
          });
        }}
      >
        {isPending ? <Spinner /> : getJobListingStatusToggleButtonText(status)}
      </Button>
      <Dialog />
    </>
  );
}

function getNextJobListingStatus(currentStatus: JobListingStatus) {
  switch (currentStatus) {
    case 'DRAFT':
    case 'UNLISTED':
      return 'PUBLISHED';
    case 'PUBLISHED':
      return 'UNLISTED';
    default:
      throw new Error(
        `Unkown job listing status: ${currentStatus satisfies never}`
      );
  }
}

function getJobListingStatusToggleButtonText(status: JobListingStatus) {
  switch (status) {
    case 'UNLISTED':
    case 'DRAFT':
      return (
        <>
          <EyeIcon className='size-4' />
          Publish
        </>
      );
    case 'PUBLISHED':
      return (
        <>
          <EyeOffIcon className='size-4' />
          Unlist
        </>
      );
    default:
      throw new Error(`Unkown status: ${status satisfies never}`);
  }
}

export default withPermission(JobListings, PERMISSIONS.ORG_JOB_LISTING_READ);
