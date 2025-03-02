import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createAudienceService } from '~/lib/audience/audience.service';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import AudienceTable from './_components/audience-table';
import { TeamAccountLayoutPageHeader } from './_components/team-account-layout-page-header';

interface TeamAccountHomePageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function TeamAccountHomePage({ params }: TeamAccountHomePageProps) {
  const account = use(params).account;

  const client = getSupabaseServerClient();
  const service = createAudienceService(client);

  const { data: audience } = use(service.getAudience());

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Audience Lists"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <AudienceTable audience={audience} />
      </PageBody>
    </>
  );
}

export default withI18n(TeamAccountHomePage);
