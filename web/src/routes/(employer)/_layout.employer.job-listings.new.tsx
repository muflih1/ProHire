import {JobListingForm} from '@/features/job-listings/components/job-listing-form';
import {Card, CardContent} from '@/components/ui/card';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/(employer)/_layout/employer/job-listings/new',
)({
  component: NewJobListingsRoute,
});

function NewJobListingsRoute() {
  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-2'>New Job Listing</h1>
      <p className='text-muted-foreground mb-6'>
        This does not post the listing yet. It just saves a draft.
      </p>
      <Card className='relative'>
        <CardContent>
          <JobListingForm />
        </CardContent>
      </Card>
    </div>
  );
}
