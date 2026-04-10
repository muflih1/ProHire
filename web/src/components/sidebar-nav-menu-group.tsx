import {LucideIcon} from 'lucide-react';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import SignedIn from './signed-in';
import SignedOut from './signed-out';
import {
  Link,
  LinkProps,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import {exactPathTest} from '@tanstack/router-core';

type NavItem = {
  icon: LucideIcon;
  label: string;
  authState?: 'SIGNED_IN' | 'SIGNED_OUT';
} & LinkProps;

type Props = {
  items: NavItem[];
  className?: string;
};

export function SidebarNavMenuGroup({items, className}: Props) {
  return (
    <SidebarGroup className={className}>
      <SidebarMenu>
        {items.map(item => (
          <SidebarMenuNavItemRenderer {...item} key={item.to} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function SidebarMenuNavItemRenderer({
  icon: Icon,
  authState,
  label,
  ...linkProps
}: NavItem) {
  const router = useRouter();

  const next = router.buildLocation(linkProps);

  const isActive = useRouterState({
    select: s =>
      exactPathTest(s.location.pathname, next.pathname, router.basepath),
  });

  const children = (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} render={<Link {...linkProps} />}>
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  if (authState === 'SIGNED_IN') {
    return <SignedIn>{children}</SignedIn>;
  }

  if (authState === 'SIGNED_OUT') {
    return <SignedOut>{children}</SignedOut>;
  }

  return children;
}
