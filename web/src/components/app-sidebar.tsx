import SignedIn from '@/components/signed-in';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import React from 'react';
import {Flexbox} from './ui/flexbox';

export function AppSidebar({
  children,
  content,
  footerButton,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  footerButton: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar variant='sidebar' collapsible='icon' className='overflow-hidden'>
        <SidebarHeader render={<Flexbox direction='row' />}>
          <SidebarTrigger />
          <span className='text-xl text-nowrap'>Job Board</span>
        </SidebarHeader>
        <SidebarContent>{content}</SidebarContent>
        <SignedIn>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>{footerButton}</SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </SignedIn>
      </Sidebar>
      <SidebarInset>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
