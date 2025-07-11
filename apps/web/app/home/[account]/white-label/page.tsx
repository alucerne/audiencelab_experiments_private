import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';

import pathsConfig from '~/config/paths.config';
import { createCreditsService } from '~/lib/credits/credits.service';
import { createWhiteLabelService } from '~/lib/white-label/white-label.service';

import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import CreditsUsage from '../usage/_components/credits-usage';
import { TeamFilterSelect } from './_components/white-label-credits-team-select';
import WhiteLabelCreditsUsage from './_components/white-label-credits-usage';
import { verifyWhiteLabelBranding } from './_lib/utils';

export default async function WhiteLabelUsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { account } = await params;
  const { client: clientId } = await searchParams;

  const workspace = await loadTeamWorkspace(account);

  const verified = await verifyWhiteLabelBranding(workspace.account.id);

  if (!verified.verified) {
    redirect(
      pathsConfig.app.accountWhiteLabelBranding.replace('[account]', account),
    );
  }

  const client = getSupabaseServerClient();
  const service = createWhiteLabelService(client);
  const creditService = createCreditsService(client);

  const accounts = await service.getTeamsIds(workspace.account.id);

  if (clientId) {
    const creditsData = await creditService.getCreditsUsage({
      accountId: clientId,
    });

    return (
      <>
        <PageHeader
          description={<AppBreadcrumbs />}
          title="White-label Credits"
          className="max-w-4xl"
        >
          <TeamFilterSelect teams={accounts} />
        </PageHeader>
        <PageBody>
          <div className={'flex w-full max-w-4xl flex-col space-y-4 pb-32'}>
            <CreditsUsage {...creditsData} />
          </div>
        </PageBody>
      </>
    );
  }

  const creditsData = await service.getWhiteLabelCredits({
    accountId: workspace.account.id,
  });

  return (
    <>
      <PageHeader
        description={<AppBreadcrumbs />}
        title="White-label Credits"
        className="max-w-4xl"
      >
        <TeamFilterSelect teams={accounts} />
      </PageHeader>
      <PageBody>
        <div className={'flex w-full max-w-4xl flex-col space-y-4 pb-32'}>
          <WhiteLabelCreditsUsage {...creditsData} />
        </div>
      </PageBody>
    </>
  );
}
