import { Tables } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { Heading } from '@kit/ui/heading';
import { PageBody } from '@kit/ui/page';

import { AdminMembersTable } from '../admin-members-table';

type Account = Tables<'accounts'>;

export async function AdminTeamMembersPage(props: {
  account: Account;
  slug?: string;
  whiteLabelHost?: boolean;
}) {
  const members = await getMembers(props.account.slug ?? '');

  return (
    <>
      <PageBody className={'space-y-6 py-4'}>
        <div>
          <div className={'flex flex-col gap-y-8'}>
            <div className={'flex flex-col gap-y-4'}>
              <Heading level={6}>Team Members</Heading>
              <AdminMembersTable
                members={members}
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

async function getMembers(accountSlug: string) {
  const client = getSupabaseServerAdminClient();

  const members = await client.rpc('get_account_members', {
    account_slug: accountSlug,
  });

  if (members.error) {
    throw members.error;
  }

  return members.data;
}
