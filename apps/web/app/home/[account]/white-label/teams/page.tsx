import { use } from 'react';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';

import pathsConfig from '~/config/paths.config';
import { createWhiteLabelService } from '~/lib/white-label/white-label.service';

import { loadTeamWorkspace } from '../../_lib/server/team-account-workspace.loader';
import WhiteLabelTeamsTable from '../_components/white-label-teams-table';
import { verifyWhiteLabelBranding } from '../_lib/utils';

export default function WhiteLabelTeamsPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  const verified = use(verifyWhiteLabelBranding(workspace.account.id));

  if (!verified.verified) {
    redirect(
      pathsConfig.app.accountWhiteLabelBranding.replace('[account]', account),
    );
  }

  const client = getSupabaseServerClient();
  const service = createWhiteLabelService(client);
  const teams = use(service.getTeams(workspace.account.id));

  return (
    <>
      <PageHeader description={<AppBreadcrumbs />} title="White-label Teams" />
      <PageBody>
        <WhiteLabelTeamsTable accounts={teams} />
      </PageBody>
    </>
  );
}
