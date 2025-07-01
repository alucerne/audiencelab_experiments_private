import { use } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createWhiteLabelService } from '~/lib/white-label/white-label.service';

import { TeamAccountLayoutPageHeader } from '../../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../../_lib/server/team-account-workspace.loader';
import { verifyWhiteLabelBranding } from '../_lib/utils';
import { WhiteLabelBrandingContainer } from './_components/white-label-branding-container';

export default function WhiteLabelBrandingPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  const client = getSupabaseServerClient();
  const service = createWhiteLabelService(client);

  const branding = use(service.getWhiteLabelBranding(workspace.account.id));

  const verified = use(verifyWhiteLabelBranding(workspace.account.id));

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={workspace.account.slug}
        title="White-label Branding"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className={'flex max-w-2xl flex-1 flex-col'}>
          <WhiteLabelBrandingContainer
            branding={branding}
            verified={verified}
          />
        </div>
      </PageBody>
    </>
  );
}
