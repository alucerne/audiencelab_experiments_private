import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminTeamPermissions from '@kit/admin/components/admin-team/admin-team-permissions';

import { loadTeam } from '../_lib/utils';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function AdminTeamPermissionsPage(props: Params) {
  const params = await props.params;
  const account = await loadTeam(params.id);

  return <AdminTeamPermissions account={account} />;
}

export default AdminGuard(AdminTeamPermissionsPage);
