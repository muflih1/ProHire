import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {SidebarMenuButton} from '@/components/ui/sidebar';
import {useUser} from '@/hooks/use-user';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import {UserResource} from '@/services/api/auth.service';
import {Link} from '@tanstack/react-router';

export function SidebarUserButton() {
  const {user} = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size='lg'
            className='data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground'
          />
        }
      >
        <UserInfo user={user} />
        <ChevronsUpDownIcon className='ml-auto group-data-[state=collapsed]:hidden' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={4}
        align='end'
        side='right'
        className='min-w-64 max-w-80'
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className='font-normal p-1'>
            <UserInfo user={user} />
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to='/personal-info' />}>
          <UserIcon className='mr-2' />
          Personal Info
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to='/' />}>
          <SettingsIcon className='mr-2' />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          <LogOutIcon className='mr-2' />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserInfo({user}: {user: UserResource | null}) {
  return (
    <div className='flex flex-row items-center gap-2 overflow-hidden'>
      <Avatar className='rounded-lg size-8'>
        <AvatarImage src={user?.profileImage?.uri} alt={user?.firstName} />
        <AvatarFallback className='bg-primary uppercase text-primary-foreground'>
          {user?.firstName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className='flex flex-col flex-1 min-w-0 leading-tight group-data-[state=collapsed]:hidden overflow-hidden'>
        <span className='truncate text-sm font-semibold'>
          {user?.firstName} {user?.lastName}
        </span>
        <span className='truncate text-sm text-muted-foreground'>
          {user?.emailAddress}
        </span>
      </div>
    </div>
  );
}
