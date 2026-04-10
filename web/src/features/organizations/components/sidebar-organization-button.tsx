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
  ArrowLeftRightIcon,
  Building2Icon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  UserRoundCogIcon,
} from 'lucide-react';
import {UserResource} from '@/services/api/auth.service';
import {Link} from '@tanstack/react-router';
import {useCurrentOrganization} from '../hooks/use-current-organization';

export function SidebarOrganizationButton() {
  const {user} = useUser();
  const {organization} = useCurrentOrganization();

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
        <OrganizationInfo user={user} organization={organization} />
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
            <OrganizationInfo user={user} organization={organization} />
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to='/employer' />}>
          <Building2Icon className='mr-2' />
          Manage Organization
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to='/employer' />}>
          <UserRoundCogIcon className='mr-2' />
          User Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to='/employer/pricing' />}>
          <CreditCardIcon className='mr-2' />
          Change Plan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to='/organization-switcher' />}>
          <ArrowLeftRightIcon className='mr-2' />
          Switch Organization
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

interface ActiveOrganizationJSON {
  id: bigint;
  name: string;
  image: {uri: string | null};
  role: string;
  roleName: string;
  createdAt: Date;
  updatedAt: Date;
}

function OrganizationInfo({
  user,
  organization,
}: {
  user: UserResource | null;
  organization: ActiveOrganizationJSON | undefined;
}) {
  return (
    <div className='flex flex-row items-center gap-2 overflow-hidden'>
      <Avatar className='rounded-lg size-8'>
        <AvatarImage
          src={organization?.image.uri ?? undefined}
          alt={organization?.name}
        />
        <AvatarFallback className='bg-linear-to-br from-blue-800 to-purple-600 uppercase text-white'>
          <Building2Icon size={16} />
        </AvatarFallback>
      </Avatar>
      <div className='flex flex-col flex-1 min-w-0 leading-tight group-data-[state=collapsed]:hidden overflow-hidden'>
        <span className='truncate text-sm font-semibold'>
          {organization?.name}
        </span>
        <span className='truncate text-sm text-muted-foreground'>
          {user?.emailAddress}
        </span>
      </div>
    </div>
  );
}
