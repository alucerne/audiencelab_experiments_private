import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { createAudienceSyncService } from '~/lib/integration-app/audience-sync.service';

import { TeamAccountLayoutPageHeader } from '../../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../../_lib/server/team-account-workspace.loader';
import AudienceSyncTable from './_components/audience-sync-table';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function SyncPage({ params }: { params: Promise<{ account: string }> }) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  const client = getSupabaseServerClient();
  const service = createAudienceSyncService(client);

  const syncs = use(
    service.getAudienceSyncs({ accountId: workspace.account.id }),
  );

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Audience Synchronization"
        description={<AppBreadcrumbs />}
      />

      <PageBody >
        <AudienceSyncTable syncs={syncs} />
      </PageBody>
    </>
  );
}

export default withI18n(SyncPage);
