import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/constants/permissions';

export default function Employer() {
  const has = usePermissions();

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
