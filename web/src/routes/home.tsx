import SignedIn from '@/components/signed-in';
import SignedOut from '@/components/signed-out';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LogInIcon } from 'lucide-react';
import { Link } from 'react-router';

export default function Home() {
  return (
    <SidebarProvider className='overflow-hidden'>
      <Sidebar collapsible='icon' className='overflow-hidden'>
        <SidebarHeader className='flex-row'>
          <SidebarTrigger />
          <span className='text-xl'>ProHire</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SignedOut>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to={'/login'}>
                      <LogInIcon />
                      <span>Log in</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SignedOut>
              <SignedIn>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to={'/employer'}>Post job</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SignedIn>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SignedIn>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Muflih</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </SignedIn>
      </Sidebar>
      <main className='flex-1'>Content</main>
    </SidebarProvider>
  );
}
