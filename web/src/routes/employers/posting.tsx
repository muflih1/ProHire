import JobListingForm from '@/components/job-listing-form';
import { Card, CardContent } from '@/components/ui/card';
import withPermission from '@/components/with-permission';
import { PERMISSIONS } from '@/constants/permissions';

function Posting() {
  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>New Job Listing</h1>
      <Card className='relative'>
        <CardContent>
          <JobListingForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default withPermission(Posting, PERMISSIONS.ORG_JOB_LISTING_WRITE);
