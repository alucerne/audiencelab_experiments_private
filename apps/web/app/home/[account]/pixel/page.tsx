import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createCreditsService } from '~/lib/credits/credits.service';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { createPixelService } from '~/lib/pixel/pixel.service';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import { PixelActionsBox } from './_components/actions-helper';
import PixelTable from './_components/pixel-table';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function PixelsPage({ params }: { params: Promise<{ account: string }> }) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  const client = getSupabaseServerClient();
  const service = createPixelService(client);
  const credits = createCreditsService(client);

  const pixels = use(service.getPixels({ accountId: workspace.account.id }));
  const limits = use(
    credits.canCreatePixel({ accountId: workspace.account.id }),
  );

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Manage Pixels"
        description={<AppBreadcrumbs />}
      />

      <PageBody className="gap-6">
        <PixelActionsBox />
        <PixelTable pixels={pixels} limits={limits} />
      </PageBody>
    </>
  );
}

export default withI18n(PixelsPage);
