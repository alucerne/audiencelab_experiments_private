import { cache } from 'react';

import { AdminGuard } from '@kit/admin/components/admin-guard';
import { AdminUserPage } from '@kit/admin/components/admin-user-page';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export const generateMetadata = async (props: Params) => {
  const params = await props.params;
  const account = await loadUser(params.id);

  return {
    title: `${account.name} | Admin`,
  };
};

async function UserPage(props: Params) {
  const params = await props.params;
  const account = await loadUser(params.id);

  return <AdminUserPage account={account} />;
}

export default AdminGuard(UserPage);

const loadUser = cache(userLoader);

async function userLoader(id: string) {
  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('is_personal_account', true)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
