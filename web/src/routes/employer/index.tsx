import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { PERMISSIONS } from '@/constants/permissions';
import usePermission from '@/hooks/use-permission';

export default function Employer() {
  const has = usePermission();

  return (
    <div className='min-h-screen flex flex-col items-center justify-center space-y-5'>
      <h1 className='text-3xl font-bold'>Employer</h1>
      {has(PERMISSIONS.ORG_JOB_LISTING_WRITE) && (
        <Button asChild>
          <Link to={'/employer/posting'}>Create job listing</Link>
        </Button>
      )}
    </div>
  );
}
