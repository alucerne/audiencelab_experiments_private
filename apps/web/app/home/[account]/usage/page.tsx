import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createCreditsService } from '~/lib/credits/credits.service';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import CreditsUsage from './_components/credits-usage';

export default function TeamAccountUsagePage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const account = use(params).account;
  const {
    account: { slug, id },
  } = use(loadTeamWorkspace(account));

  const client = getSupabaseServerClient();
  const service = createCreditsService(client);

  const creditsData = use(service.getCreditsUsage({ accountId: id }));

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={slug}
        title="Credits Usage"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className={'flex w-full max-w-4xl flex-col space-y-4 pb-32'}>
          <CreditsUsage {...creditsData} />
        </div>
      </PageBody>
    </>
  );
}
