'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

function getNavigationItems(accountId: string) {
  return [
    {
      label: 'Permissions',
      href: `/admin/teams/${accountId}/white-label`,
      description: 'Credits for white-label',
    },
    {
      label: 'Teams',
      href: `/admin/teams/${accountId}/white-label/teams`,
      description: 'Teams managed by this white-label',
    },
    {
      label: 'Signup Links',
      href: `/admin/teams/${accountId}/white-label/signup-links`,
      description: 'Invites to join white-label',
    },
    {
      label: 'Profile',
      href: `/admin/teams/${accountId}/white-label/profile`,
      description: 'Logos and branding',
    },
  ];
}

export default function AdminWhiteLabelNavigation({
  accountId,
}: {
  accountId: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {getNavigationItems(accountId).map((item) => (
        <NavigationItem
          key={item.href}
          item={item}
          isActive={pathname === item.href}
        />
      ))}
    </nav>
  );
}

function NavigationItem({
  item,
  isActive = false,
}: {
  item: {
    label: string;
    href: string;
    description: string;
  };
  isActive?: boolean;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'w-full',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
      )}
    >
      <Link href={item.href}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{item.label}</div>
          <div className="mt-0.5 text-xs leading-relaxed">
            {item.description}
          </div>
        </div>
      </Link>
    </Button>
  );
}
