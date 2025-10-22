import { useAuth } from '@/providers/auth-provider';
import { Link } from 'react-router';
import SignedIn from './signed-in';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useMutation } from '@tanstack/react-query';
import { axios } from '@/lib/axios';
import useConfirm from '@/hooks/use-confirm';
import { Spinner } from './ui/spinner';

export default function Header() {
  const user = useAuth();
  return (
    <header className='h-14 w-full px-4 flex items-center border-b border-b-input justify-between'>
      <Link to={'/'} className='text-xl font-bold select-none'>
        ProHire
      </Link>
      <div className='ml-auto flex gap-x-1'>
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'ghost'}>
                <UserIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='min-w-64'>
              <DropdownMenuLabel>
                <div className='flex items-center gap-2 overflow-hidden'>
                  <div className='shrink-0 basis-8'>
                    <Avatar className='size-9'>
                      <AvatarImage
                        src={user?.imageURL ?? undefined}
                        alt='Profile picture'
                      />
                      <AvatarFallback>
                        {user?.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className='flex flex-col grow shrink leading-tight'>
                    <span className='truncate text-sm font-semibold'>
                      {user?.displayName}
                    </span>
                    <span className='truncate text-sm font-normal text-muted-foreground'>
                      {user?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to={'/profile'}>
                    <UserIcon /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon /> Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <SignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </SignedIn>
        <Button variant={'link'} asChild>
          <Link to={'/employers'}>Employers</Link>
        </Button>
      </div>
    </header>
  );
}

function SignOutMenuItem() {
  const { mutate, isPending } = useMutation({
    mutationKey: ['logout'],
    mutationFn: () => axios.delete('/auth/logout'),
    onSuccess: () => {
      window.location.reload();
    },
  });
  const [Dialog, confirm] = useConfirm(
    'Log out of ProHire?',
    'You can always log back in at any time.'
  );

  return (
    <>
      <DropdownMenuItem
        variant='destructive'
        disabled={isPending}
        onClick={async e => {
          e.preventDefault();
          if (!(await confirm())) return;

          mutate();
        }}
      >
        {isPending && <Spinner />}
        <LogOutIcon /> Log out
      </DropdownMenuItem>
      <Dialog actionButton={{ title: 'Log out' }} />
    </>
  );
}
