import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminWhiteLabelTeamsTable from '@kit/admin/components/admin-white-label/admin-white-label-teams-table';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function AdminWhiteLabelTeamsPage(props: Params) {
  const params = await props.params;
  const data = await getWhiteLabelTeams(params.id);

  return <AdminWhiteLabelTeamsTable accounts={data} />;
}

export default AdminGuard(AdminWhiteLabelTeamsPage);

async function getWhiteLabelTeams(whiteLabelId: string) {
  const client = getSupabaseServerAdminClient();
  const { data, error } = await client
    .from('accounts')
    .select('*')
    .eq('whitelabel_host_account_id', whiteLabelId)
    .eq('is_personal_account', false);

  if (error) {
    throw error;
  }

  return data;
}
