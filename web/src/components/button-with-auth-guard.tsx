import { useAuth } from '@/providers/auth-provider';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Link, useLocation } from 'react-router';

export default function ButtonWithAuthGuard({
  children,
  message,
}: React.PropsWithChildren<{ message: React.ReactNode }>) {
  const user = useAuth();
  const location = useLocation();

  if (user == null) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent>
          {message}
          <div className='grid mt-1'>
            <Button asChild>
              <Link to={'/login'} state={{ from: location.pathname }}>
                Sign in
              </Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return children;
}
