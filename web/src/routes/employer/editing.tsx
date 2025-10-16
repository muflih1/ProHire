import JobListingForm from '@/components/job-listing-form';
import { Card, CardContent } from '@/components/ui/card';
import withPermission from '@/components/with-permission';
import { PERMISSIONS } from '@/constants/permissions';
import { useActiveOrganization } from '@/providers/active-organization-provider';
import { omit } from '@/utils/object';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router';

function JobListingEditing() {
  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch job listing.'>
        <JobListingEditingImpl />
      </ErrorBoundary>
    </Suspense>
  );
}

function JobListingEditingImpl() {
  const params = useParams<{ jobListingID: string }>();
  const organization = useActiveOrganization();
  const trpc = useTRPC();
  const { data: jobListing } = useSuspenseQuery(
    trpc.getJobListingByID.queryOptions({
      jobListingID: params.jobListingID!,
      organizationID: organization.id.toString(),
    })
  );

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Edit Job Listing</h1>
      <Card className='relative'>
        <CardContent>
          <JobListingForm
            jobListing={omit(jobListing, [
              'organizationID',
              'status',
              'postedAt',
              'createdAt',
              'updatedAt',
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default withPermission(
  JobListingEditing,
  PERMISSIONS.ORG_JOB_LISTING_UPDATE
);
