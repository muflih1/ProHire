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
import { UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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
            <DropdownMenuContent>
              <DropdownMenuLabel className='flex items-center'>
                <div className='shrink-0 basis-9'>
                  <Avatar className='size-9'>
                    <AvatarImage
                      src={user!.imageURL ?? undefined}
                      alt='Profile picture'
                    />
                    <AvatarFallback>
                      {user!.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive'>Log out</DropdownMenuItem>
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
