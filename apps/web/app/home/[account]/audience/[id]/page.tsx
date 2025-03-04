import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { createAudienceService } from '~/lib/audience/audience.service';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../../_components/team-account-layout-page-header';
import AudienceFiltersForm from './_components/audience-filters-form';

export const metadata = {
  title: 'Audience Filters',
};

interface AddAudiencePageProps {
  params: Promise<{ account: string; id: string }>;
}

async function AddAudiencePage({ params }: AddAudiencePageProps) {
  const { account, id } = await params;

  const client = getSupabaseServerClient();
  const service = createAudienceService(client);

  const audience = await service.getAudienceById(id);

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title={`${audience.name} Audience Filters`}
        description={<AppBreadcrumbs uuidLabel="Filters" />}
      />
      <PageBody>
        <AudienceFiltersForm defaultValues={audience.filters} />
      </PageBody>
    </>
  );
}

export default withI18n(AddAudiencePage);
