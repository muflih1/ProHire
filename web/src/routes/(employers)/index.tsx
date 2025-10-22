import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { PERMISSIONS } from '@/constants/permissions';
import usePermission from '@/hooks/use-permission';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from '@/providers/active-organization-provider';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import DeleteJobListingButton from '@/components/delete-job-listing-button';
import { EditIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateTime } from 'luxon';
import { formatJobStatus } from '@/utils/formatters/job-listing';
import { JobListingStatus } from '@/constants/job-listing';

export default function Employer() {
  const has = usePermission();

  return (
    <div className='min-h-screen flex flex-col items-center justify-center space-y-5'>
      <h1 className='text-3xl font-bold'>Employer</h1>
      {has(PERMISSIONS.ORG_JOB_LISTING_WRITE) && (
        <Button asChild>
          <Link to={'/employers/posting'}>Create job listing</Link>
        </Button>
      )}
      {has(PERMISSIONS.ORG_JOB_LISTING_LIST) && (
        <Suspense fallback='Loading...'>
          <ErrorBoundary fallback='Failed to fetch job listings.'>
            <JobListingsTable />
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  );
}

function JobListingsTable() {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.jobListingsListEmployer.queryOptions({
      organizationID: organization.id.toString(),
    })
  );
  const has = usePermission();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job title</TableHead>
          <TableHead>Candidates</TableHead>
          <TableHead>Date posted</TableHead>
          <TableHead>Job status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(jobListing => (
          <TableRow key={jobListing.id}>
            <TableCell className='font-medium'>
              {has(PERMISSIONS.ORG_JOB_LISTING_READ) ? (
                <Link
                  to={`/employers/job-listings/${jobListing.id}`}
                  className='text-blue-600 hover:underline'
                >
                  {jobListing.title}
                </Link>
              ) : (
                jobListing.title
              )}
            </TableCell>
            <TableCell>{jobListing.applicationCount}</TableCell>
            <TableCell>
              {jobListing.postedAt != null
                ? DateTime.fromJSDate(jobListing.postedAt).toRelative()
                : formatJobStatus(jobListing.status as JobListingStatus)}
            </TableCell>
            <TableCell>
              {formatJobStatus(jobListing.status as JobListingStatus)}
            </TableCell>
            <td>
              <div className='flex gap-1'>
                {has(PERMISSIONS.ORG_JOB_LISTING_UPDATE) && (
                  <Button asChild size={'sm'} variant={'outline'}>
                    <Link
                      to={`/employers/job-listings/${jobListing.id}/editing`}
                    >
                      <EditIcon />
                      Edit
                    </Link>
                  </Button>
                )}
                {has(PERMISSIONS.ORG_JOB_LISTING_DELETE) && (
                  <DeleteJobListingButton
                    jobListingID={jobListing.id}
                    size='sm'
                  />
                )}
              </div>
            </td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
