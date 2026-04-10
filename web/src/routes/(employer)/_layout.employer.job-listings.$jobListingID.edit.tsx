import {Card, CardContent} from '@/components/ui/card';
import {JobListingForm} from '@/features/job-listings/components/job-listing-form';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(employer)/_layout/employer/job-listings/$jobListingID/edit',
)({
  component: EditJobListingRoute,
  loader: ({context, params}) => {
    void context.queryClient.prefetchQuery(
      context.trpc.jobListings.get.queryOptions({
        jobListingID: params.jobListingID,
      }),
    );
  },
});

function EditJobListingRoute() {
  const jobListingID = Route.useParams({select: p => p.jobListingID})
  const trpc = useTRPC()

  const {data} = useSuspenseQuery(trpc.jobListings.get.queryOptions({jobListingID}))

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-2'>Edit Job Listing</h1>
      <Card className='relative'>
        <CardContent>
          <JobListingForm jobListing={data} />
        </CardContent>
      </Card>
    </div>
  );
}
