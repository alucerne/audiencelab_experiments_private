import { BadgeX } from 'lucide-react';

import { AdminDeleteAccountDialog } from '@kit/admin/components/admin-delete-account-dialog';
import AdminRestrictAccountDialog from '@kit/admin/components/admin-restrict-account-dialog';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { PageHeader } from '@kit/ui/page';
import { ProfileAvatar } from '@kit/ui/profile-avatar';

import AdminTeamNavigation from '~/admin/teams/[id]/_components/admin-team-navigation';

import { loadWhiteLabelTeam } from './_lib/utils';

type Params = React.PropsWithChildren<{
  params: Promise<{
    account: string;
    id: string;
  }>;
}>;

export default async function AdminTeamLayout(props: Params) {
  const params = await props.params;
  const account = await loadWhiteLabelTeam(params.id);

  return (
    <>
      <PageHeader
        className="pb-2"
        description={
          <AppBreadcrumbs
            values={{
              [account.id]: account.name ?? account.email ?? 'Account',
            }}
          />
        }
      >
        <div className="flex items-center gap-3">
          <AdminRestrictAccountDialog
            accountId={account.id}
            currentlyRestricted={account.restricted}
          />
          <AdminDeleteAccountDialog accountId={account.id}>
            <Button size={'sm'} variant={'destructive'}>
              <BadgeX className={'mr-1 h-4'} />
              Delete
            </Button>
          </AdminDeleteAccountDialog>
        </div>
      </PageHeader>
      <div className={'flex items-end justify-between border-b px-4'}>
        <div className={'flex items-center gap-x-4 pb-2.5'}>
          <div className={'flex items-center gap-x-2.5'}>
            <ProfileAvatar
              pictureUrl={account.picture_url}
              displayName={account.name}
            />
            <span className={'text-sm font-semibold capitalize'}>
              {account.name}
            </span>
          </div>
          <Badge variant={'outline'}>Team Account</Badge>
          {account.whitelabel_credits && (
            <Badge variant={'outline'}>White-label Host</Badge>
          )}
        </div>
        <AdminTeamNavigation
          accountId={account.id}
          slug={params.account}
          whiteLabelHost
        />
      </div>
      {props.children}
    </>
  );
}
