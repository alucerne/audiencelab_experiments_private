import { use } from 'react';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import { createCreditsService } from '~/lib/credits/credits.service';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { loadTeamWorkspace } from '../../_lib/server/team-account-workspace.loader';
import EnrichmentUploadForm from './_components/enrichment-upload-form';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function EnrichmentUploadPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  const client = getSupabaseServerClient();
  const credits = createCreditsService(client);

  const limits = use(
    credits.canCreateEnrichment({ accountId: workspace.account.id }),
  );

  if (!limits.enabled) {
    redirect(pathsConfig.app.accountEnrichment.replace('[account]', account));
  }

  return <EnrichmentUploadForm sizeLimit={100} />;
}

export default withI18n(EnrichmentUploadPage);
