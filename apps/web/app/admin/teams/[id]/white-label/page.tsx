import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminTeamWhiteLabel from '@kit/admin/components/admin-team/admin-team-white-label';

import { loadTeam } from '../_lib/utils';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function AdminWhiteLabelPage(props: Params) {
  const params = await props.params;
  const account = await loadTeam(params.id);

  return <AdminTeamWhiteLabel account={account} />;
}

export default AdminGuard(AdminWhiteLabelPage);
