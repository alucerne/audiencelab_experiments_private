import { use } from 'react';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';

import pathsConfig from '~/config/paths.config';
import { createWhiteLabelService } from '~/lib/white-label/white-label.service';

import { loadTeamWorkspace } from '../../_lib/server/team-account-workspace.loader';
import { verifyWhiteLabelBranding } from '../_lib/utils';
import SignupLinksTable from './_components/table';

export default function WhiteLabelSignupLinksPage({
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

  const branding = use(service.getWhiteLabelBranding(workspace.account.id));
  const signupLinks = use(service.getSignupLinks(workspace.account.id));

  return (
    <>
      <PageHeader
        description={<AppBreadcrumbs />}
        title="White-label Signup Links"
      />
      <PageBody>
        <SignupLinksTable
          signupLinks={signupLinks}
          signupUrl={'https://' + branding.domain + pathsConfig.auth.signUp}
        />
      </PageBody>
    </>
  );
}
