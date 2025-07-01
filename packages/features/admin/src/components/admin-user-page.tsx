import { BadgeX, Ban, ShieldPlus, VenetianMask } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { If } from '@kit/ui/if';
import { PageBody, PageHeader } from '@kit/ui/page';
import { ProfileAvatar } from '@kit/ui/profile-avatar';

import { AdminBanUserDialog } from './admin-ban-user-dialog';
import { AdminDeleteUserDialog } from './admin-delete-user-dialog';
import { AdminImpersonateUserDialog } from './admin-impersonate-user-dialog';
import { AdminMembershipsTable } from './admin-memberships-table';
import { AdminReactivateUserDialog } from './admin-reactivate-user-dialog';

type Account = Tables<'accounts'>;
type Membership = Tables<'accounts_memberships'>;

export async function AdminUserPage(props: {
  account: Account;
  whiteLabelHost?: boolean;
  slug?: string;
}) {
  const client = getSupabaseServerAdminClient();

  const memberships = await getMemberships(props.account.id);
  const { data, error } = await client.auth.admin.getUserById(props.account.id);

  if (!data || error) {
    throw new Error(`User not found`);
  }

  const isBanned =
    'banned_until' in data.user && data.user.banned_until !== 'none';

  return (
    <>
      <PageHeader
        className="border-b"
        description={
          <AppBreadcrumbs
            values={{
              [props.account.id]:
                props.account.name ?? props.account.email ?? 'Account',
            }}
          />
        }
      >
        <div className={'flex gap-x-2.5'}>
          <If condition={isBanned}>
            <AdminReactivateUserDialog userId={props.account.id}>
              <Button size={'sm'} variant={'secondary'}>
                <ShieldPlus className={'mr-1 h-4'} />
                Reactivate
              </Button>
            </AdminReactivateUserDialog>
          </If>

          <If condition={!isBanned}>
            <AdminBanUserDialog userId={props.account.id}>
              <Button size={'sm'} variant={'secondary'}>
                <Ban className={'text-destructive mr-1 h-3'} />
                Ban
              </Button>
            </AdminBanUserDialog>

            <AdminImpersonateUserDialog userId={props.account.id}>
              <Button size={'sm'} variant={'secondary'}>
                <VenetianMask className={'mr-1 h-4 text-blue-500'} />
                Impersonate
              </Button>
            </AdminImpersonateUserDialog>
          </If>

          <AdminDeleteUserDialog userId={props.account.id}>
            <Button size={'sm'} variant={'destructive'}>
              <BadgeX className={'mr-1 h-4'} />
              Delete
            </Button>
          </AdminDeleteUserDialog>
        </div>
      </PageHeader>

      <PageBody className={'space-y-6 py-4'}>
        <div className={'flex items-center justify-between'}>
          <div className={'flex items-center gap-x-4'}>
            <div className={'flex items-center gap-x-2.5'}>
              <ProfileAvatar
                pictureUrl={props.account.picture_url}
                displayName={props.account.name}
              />

              <span className={'text-sm font-semibold capitalize'}>
                {props.account.name}
              </span>
            </div>

            <Badge variant={'outline'}>Personal Account</Badge>

            <If condition={isBanned}>
              <Badge variant={'destructive'}>Banned</Badge>
            </If>
          </div>
        </div>

        <div className={'flex flex-col gap-y-8'}>
          {/* <SubscriptionsTable accountId={props.account.id} /> */}

          <div className={'divider-divider-x flex flex-col gap-y-2.5'}>
            <Heading level={6}>Teams</Heading>

            <div>
              <AdminMembershipsTable
                memberships={memberships}
                whiteLabelHost={props.whiteLabelHost}
                slug={props.slug}
              />
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}

async function getMemberships(userId: string) {
  const client = getSupabaseServerAdminClient();

  const memberships = await client
    .from('accounts_memberships')
    .select<
      string,
      Membership & {
        account: {
          id: string;
          name: string;
        };
      }
    >('*, account: account_id !inner (id, name)')
    .eq('user_id', userId);

  if (memberships.error) {
    throw memberships.error;
  }

  return memberships.data;
}
