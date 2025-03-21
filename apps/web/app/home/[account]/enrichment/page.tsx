import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createCreditsService } from '~/lib/credits/credits.service';
import { createEnrichmentService } from '~/lib/enrichment/enrichment.service';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import EnrichmentTable from './_components/enrichment-table';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function EnrichmentPage({ params }: { params: Promise<{ account: string }> }) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  const client = getSupabaseServerClient();
  const service = createEnrichmentService(client);
  const credits = createCreditsService(client);

  const enrichment = use(
    service.getEnrichments({ accountId: workspace.account.id }),
  );
  const limits = use(
    credits.canCreateEnrichment({ accountId: workspace.account.id }),
  );

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Enrichment"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <EnrichmentTable enrichment={enrichment} limits={limits} />
      </PageBody>
    </>
  );
}

export default withI18n(EnrichmentPage);
