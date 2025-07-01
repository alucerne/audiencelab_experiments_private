'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { User, UserPlus, Users } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from '@kit/ui/shadcn-sidebar';

import { DynamicLogo } from '~/components/dynamic-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';

export function AdminSidebar() {
  const path = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={'m-2'}>
        <DynamicLogo href={'/admin'} className="max-w-full" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuButton isActive={path === '/admin'} asChild>
                <Link className={'flex gap-2.5'} href={'/admin'}>
                  <Users className={'h-4'} />
                  <span>Teams</span>
                </Link>
              </SidebarMenuButton>

              <SidebarMenuButton isActive={path === '/admin/users'} asChild>
                <Link
                  className={'flex size-full gap-2.5'}
                  href={'/admin/users'}
                >
                  <User className={'h-4'} />
                  <span>Users</span>
                </Link>
              </SidebarMenuButton>

              <SidebarMenuButton
                isActive={path === '/admin/signup-links'}
                asChild
              >
                <Link
                  className={'flex size-full gap-2.5'}
                  href={'/admin/signup-links'}
                >
                  <UserPlus className={'h-4'} />
                  <span>Signup Links</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ProfileAccountDropdownContainer />
      </SidebarFooter>
    </Sidebar>
  );
}
