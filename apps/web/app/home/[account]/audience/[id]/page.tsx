import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceService } from '~/lib/audience/audience.service';
import { createCreditsService } from '~/lib/credits/credits.service';
import { withI18n } from '~/lib/i18n/with-i18n';

import { loadTeamWorkspace } from '../../_lib/server/team-account-workspace.loader';
import AudienceFiltersForm from './_components/audience-filters-form';

export const metadata = {
  title: 'Audience Filters',
};

interface AddAudiencePageProps {
  params: Promise<{ account: string; id: string }>;
}

async function AddAudiencePage({ params }: AddAudiencePageProps) {
  const { id, account } = await params;
  const workspace = await loadTeamWorkspace(account);

  const client = getSupabaseServerClient();
  const service = createAudienceService(client);
  const credits = createCreditsService(client);

  const [audience, limits] = await Promise.all([
    service.getAudienceById(id),
    credits.getAudienceLimits({
      accountId: workspace.account.id,
    }),
  ]);

  return (
    <AudienceFiltersForm
      defaultValues={audience.filters}
      audienceName={audience.name}
      limits={limits}
    />
  );
}

export default withI18n(AddAudiencePage);
