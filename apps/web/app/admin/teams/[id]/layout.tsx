import { BadgeX } from 'lucide-react';

import { AdminDeleteAccountDialog } from '@kit/admin/components/admin-delete-account-dialog';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminRestrictAccountDialog from '@kit/admin/components/admin-restrict-account-dialog';
import AdminRestrictWhiteLabelDialog from '@kit/admin/components/admin-white-label/admin-restrict-white-label-dialog';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { PageHeader } from '@kit/ui/page';
import { ProfileAvatar } from '@kit/ui/profile-avatar';

import AdminTeamNavigation from './_components/admin-team-navigation';
import { loadTeam } from './_lib/utils';

type Params = React.PropsWithChildren<{
  params: Promise<{
    id: string;
  }>;
}>;

export const generateMetadata = async (props: Params) => {
  const params = await props.params;
  const account = await loadTeam(params.id);

  return {
    title: `${account.name} | Admin`,
  };
};

async function AdminTeamLayout(props: Params) {
  const params = await props.params;
  const account = await loadTeam(params.id);

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
          {account.whitelabel_credits && (
            <AdminRestrictWhiteLabelDialog
              accountId={account.id}
              currentlyRestricted={account.whitelabel_credits.restricted}
            />
          )}
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
        <AdminTeamNavigation accountId={account.id} />
      </div>
      {props.children}
    </>
  );
}

export default AdminGuard(AdminTeamLayout);
