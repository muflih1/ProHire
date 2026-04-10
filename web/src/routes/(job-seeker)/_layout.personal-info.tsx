import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {useUser} from '@/hooks/use-user';
import {createFileRoute} from '@tanstack/react-router';
import {
  CameraIcon,
  ContactRoundIcon,
  MailIcon,
  RectangleEllipsisIcon,
} from 'lucide-react';

export const Route = createFileRoute('/(job-seeker)/_layout/personal-info')({
  beforeLoad: ({context}) => {
    if (!context.session) {
      throw Route.redirect({
        to: '/sign-in',
        replace: false,
        search: {continue: '/personal-info'},
      });
    }
  },
  component: PersonalInfoRoute,
});

function PersonalInfoRoute() {
  const {user} = useUser();
  return (
    <div className='flex-1 flex-col items-center'>
      <div className='max-w-3xl mx-auto w-full mt-4'>
        <h2 className='mb-6 text-3xl font-bold leading-tight'>Personal info</h2>
        <div className='flex flex-col gap-y-1'>
          <Route.Link
            to='/'
            className='flex items-center select-none bg-secondary rounded-b rounded-t-xl py-3 px-4 text gap-3 transition-colors hover:bg-black/4'
          >
            <div className='flex flex-row item-center justify-center gap-2 5 shrink-0 w-10'>
              <CameraIcon size={24} className='shrink-0' />
            </div>
            <div className='grow shrink flex flex-col justify-center overflow-hidden'>
              <span className='text-base font-medium leading-normal tracking-0 text-secondary-foreground'>
                Profile Image
              </span>
            </div>
            <div className='flex items-center'>
              <Avatar className='size-12 rounded-full overflow-hidden'>
                <AvatarImage
                  src={user?.profileImage?.uri}
                  alt={user?.firstName}
                />
                <AvatarFallback className='bg-primary text-primary-foreground text-lg'>
                  {user?.firstName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </Route.Link>
          <Route.Link
            to='/'
            className='flex items-center select-none bg-secondary rounded py-3 px-4 text gap-3'
          >
            <div className='flex flex-row item-center justify-center gap-2 5 shrink-0 w-10'>
              <ContactRoundIcon size={24} className='shrink-0' />
            </div>
            <div className='grow shrink flex flex-col justify-center overflow-hidden'>
              <div>
                <span className='text-base font-medium leading-normal tracking-0 text-secondary-foreground'>
                  Name
                </span>
              </div>
              <div>
                <span className='truncate text-base font-normal leading-snug tracking-0 text-muted-foreground'>
                  {user?.firstName}&nbsp;{user?.lastName}
                </span>
              </div>
            </div>
          </Route.Link>
          <Route.Link
            to='/'
            className='flex items-center select-none bg-secondary rounded py-3 px-4 text gap-3'
          >
            <div className='flex flex-row item-center justify-center gap-2 5 shrink-0 w-10'>
              <MailIcon size={24} className='shrink-0' />
            </div>
            <div className='grow shrink flex flex-col justify-center overflow-hidden'>
              <div>
                <span className='text-base font-medium leading-normal tracking-0 text-secondary-foreground'>
                  Email Address
                </span>
              </div>
              <div>
                <span className='truncate text-base font-normal leading-snug tracking-0 text-muted-foreground'>
                  {user?.emailAddress}
                </span>
              </div>
            </div>
          </Route.Link>
          <Route.Link
            to='/'
            className='flex items-center select-none bg-secondary rounded-t rounded-b-xl py-3 px-4 text gap-3 min-h-15'
          >
            <div className='flex flex-row item-center justify-center gap-2 5 shrink-0 w-10'>
              <RectangleEllipsisIcon size={24} className='shrink-0' />
            </div>
            <div className='grow shrink flex flex-col justify-center overflow-hidden'>
              <div>
                <span className='text-base font-medium leading-normal tracking-0 text-secondary-foreground'>
                  Password
                </span>
              </div>
            </div>
          </Route.Link>
        </div>
      </div>
    </div>
  );
}
