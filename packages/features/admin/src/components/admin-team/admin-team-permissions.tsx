import { Tables } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Heading } from '@kit/ui/heading';
import { PageBody } from '@kit/ui/page';

import AdminAddCreditsDialog from './admin-add-credits-dialog';
import AdminCreditsForm from './admin-credits-form';

type Account = Tables<'accounts'>;

export default async function AdminTeamPermissions(props: {
  account: Account;
  whiteLabelHost?: boolean;
}) {
  const permissions = await getPermissions(props.account.id);

  return (
    <>
      <PageBody className={'space-y-4 py-4'}>
        <Heading level={6} className="flex w-full items-start justify-between">
          Permissions
          {!props.whiteLabelHost && (
            <AdminAddCreditsDialog credits={permissions} />
          )}
        </Heading>
        {!props.whiteLabelHost && props.account.whitelabel_host_account_id && (
          <Alert variant={'destructive'} className="bg-destructive/5">
            <AlertTitle>This account is a sub-whitelabel account.</AlertTitle>
            <AlertDescription>
              Before making changes to permissions, please ensure that you
              understand the implications of modifying permissions for a
              sub-whitelabel account. Changes may affect the parent whitelabel
              and its associated accounts.
            </AlertDescription>
          </Alert>
        )}

        <AdminCreditsForm credits={permissions} />
      </PageBody>
    </>
  );
}

async function getPermissions(accountId: string) {
  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('credits')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
