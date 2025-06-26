import { Tables } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { PageBody } from '@kit/ui/page';

import AdminCreditsForm from './admin-credits-form';

type Account = Tables<'accounts'>;

export default async function AdminTeamWhiteLabel(props: { account: Account }) {
  const permissions = await getPermissions(props.account.id);

  return (
    <>
      <PageBody className={'space-y-6 py-4'}>
        <AdminCreditsForm credits={permissions} />
      </PageBody>
    </>
  );
}

async function getPermissions(accountId: string) {
  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('whitelabel_credits')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
