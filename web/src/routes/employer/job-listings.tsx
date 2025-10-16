import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import withPermission from '@/components/with-permission';
import type {
  ExperienceLevel,
  JobLocationRequirement,
  JobListingStatus,
  JobType,
  WageInterval,
} from '@/constants/job-listing';
import { PERMISSIONS } from '@/constants/permissions';
import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from '@/providers/active-organization-provider';
import {
  formatExperienceLevel,
  formatJobLocationRequirement,
  formatJobStatus,
  formatJobType,
  formatWage,
} from '@/utils/formatters/job-listing';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  BanknoteIcon,
  BuildingIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  GraduationCapIcon,
  HourglassIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link, useParams } from 'react-router';
import Markdown from 'react-markdown';
import usePermission from '@/hooks/use-permission';

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
            <Badge variant={'outline'}>
              <BanknoteIcon />
              {formatWage(
                jobListing.wage,
                jobListing.wageInterval as WageInterval
              )}
            </Badge>
            <Badge variant={'outline'}>
              <BuildingIcon />
              {formatJobLocationRequirement(
                jobListing.locationRequirement as JobLocationRequirement
              )}
            </Badge>
            <Badge variant={'outline'}>
              <HourglassIcon />
              {formatJobType(jobListing.type as JobType)}
            </Badge>
            <Badge variant={'outline'}>
              <GraduationCapIcon />
              {formatExperienceLevel(
                jobListing.experienceLevel as ExperienceLevel
              )}
            </Badge>
          </div>
        </div>
        <div className='flex items-center gap-2 empty:contents'>
          {has(PERMISSIONS.ORG_JOB_LISTING_UPDATE) && (
            <Button asChild variant={'outline'}>
              <Link to={`/employer/job-listings/${jobListing.id}/editing`}>
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
        </div>
      </div>
      <div className='prose'>
        <Markdown>{jobListing.description}</Markdown>
      </div>
    </div>
  );
}

function UpdateJobListingStatusButton({
  status,
  id,
}: {
  status: JobListingStatus;
  id: string;
}) {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const trpc = useTRPC();
  const mutation = useMutation(trpc.updateJobListingStatus.mutationOptions());

  return (
    <Button
      variant={'outline'}
      onClick={() =>
        mutation.mutate({
          jobLisstingID: id,
          newStatus: getNextJobListingStatus(status),
          organizationID: organization.id.toString(),
        })
      }
    >
      {getJobListingStatusToggleButtonText(status)}
    </Button>
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
