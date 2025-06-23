'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

export default function AdminTeamNavigation({
  accountId,
  slug,
  whiteLabelHost,
}: {
  accountId: string;
  slug?: string;
  whiteLabelHost?: boolean;
}) {
  const pathname = usePathname();

  const membersPath = whiteLabelHost
    ? `/home/${slug}/white-label/teams/${accountId}`
    : `/admin/teams/${accountId}`;

  const permissionsPath = whiteLabelHost
    ? `/home/${slug}/white-label/teams/${accountId}/permissions`
    : `/admin/teams/${accountId}/permissions`;

  return (
    <div className="flex items-center gap-x-1">
      <Button
        asChild
        variant="ghost"
        className={cn(
          'rounded-b-none',
          pathname === membersPath
            ? 'border-foreground border-b-2'
            : 'text-muted-foreground',
        )}
      >
        <Link href={membersPath}>Members</Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className={cn(
          'rounded-b-none',
          pathname === permissionsPath
            ? 'border-foreground border-b-2'
            : 'text-muted-foreground',
        )}
      >
        <Link href={permissionsPath}>Permissions</Link>
      </Button>
      {!whiteLabelHost && (
        <Button
          asChild
          variant="ghost"
          className={cn(
            'rounded-b-none',
            pathname.startsWith(`/admin/teams/${accountId}/white-label`)
              ? 'border-foreground border-b-2'
              : 'text-muted-foreground',
          )}
        >
          <Link href={`/admin/teams/${accountId}/white-label`}>
            White-label
          </Link>
        </Button>
      )}
    </div>
  );
}
