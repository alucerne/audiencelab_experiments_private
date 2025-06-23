import React from 'react';

import Link from 'next/link';

import AdminEnableWhiteLabelDialog from '@kit/admin/components/admin-enable-white-label-dialog';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { Button } from '@kit/ui/button';

import AdminWhiteLabelNavigation from './_components/admin-white-label-navigation';
import { loadWhiteLabel } from './_lib/utils';

type Params = React.PropsWithChildren<{
  params: Promise<{
    id: string;
  }>;
}>;

async function AdminTeamWhiteLabelLayout(props: Params) {
  const params = await props.params;
  const whitelabelStatus = await loadWhiteLabel(params.id);

  if (whitelabelStatus === 'regular') {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2.5 p-6 pt-12 text-center">
        <p className="text-lg font-medium">
          🚫 This account does not have white-label access.
        </p>
        <AdminEnableWhiteLabelDialog accountId={params.id} />
      </div>
    );
  }

  if (
    typeof whitelabelStatus === 'object' &&
    whitelabelStatus.status === 'subaccount'
  ) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2.5 p-6 pt-12 text-center">
        <p className="text-lg font-medium">
          🚫 This account is a part of another white-label account of{' '}
          <span className="font-semibold">{whitelabelStatus.host.name}</span>.
        </p>
        <p className="text-sm">
          This team can&apos;t become a white-label host, as it is a subaccount
          of another white-label.
        </p>
        <Button asChild className='mt-4'>
          <Link href={`/admin/teams/${whitelabelStatus.host.id}/white-label`}>
            Go to White-label Host
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex gap-8 py-8">
        <div className="w-64 flex-shrink-0">
          <div className="mb-6 flex flex-col justify-between">
            <h2 className="mb-4 text-lg font-semibold">White-label Settings</h2>
            <AdminWhiteLabelNavigation accountId={params.id} />
          </div>
        </div>
        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    </div>
  );
}

export default AdminGuard(AdminTeamWhiteLabelLayout);
