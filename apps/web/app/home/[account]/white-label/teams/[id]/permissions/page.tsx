import AdminTeamPermissions from '@kit/admin/components/admin-team/admin-team-permissions';

import { loadWhiteLabelTeam } from '../_lib/utils';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export default async function WhiteLabelTeamPermissionsPage(props: Params) {
  const params = await props.params;
  const account = await loadWhiteLabelTeam(params.id);

  return <AdminTeamPermissions account={account} whiteLabelHost />;
}
