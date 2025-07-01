import { AdminTeamMembersPage } from '@kit/admin/components/admin-team/admin-team-members-page';

import { loadWhiteLabelTeam } from './_lib/utils';

interface Params {
  params: Promise<{
    account: string;
    id: string;
  }>;
}

export default async function WhiteLabelTeamPage(props: Params) {
  const params = await props.params;
  const account = await loadWhiteLabelTeam(params.id);

  return (
    <AdminTeamMembersPage
      account={account}
      slug={params.account}
      whiteLabelHost
    />
  );
}
