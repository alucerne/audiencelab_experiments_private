import { AdminGuard } from '@kit/admin/components/admin-guard';
import { AdminTeamMembersPage } from '@kit/admin/components/admin-team/admin-team-members-page';

import { loadTeam } from './_lib/utils';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function AdminTeamPage(props: Params) {
  const params = await props.params;
  const account = await loadTeam(params.id);

  return <AdminTeamMembersPage account={account} />;
}

export default AdminGuard(AdminTeamPage);
