import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceService } from '~/lib/audience/audience.service';
import { withI18n } from '~/lib/i18n/with-i18n';

import AudienceFiltersForm from './_components/audience-filters-form';

export const metadata = {
  title: 'Audience Filters',
};

interface AddAudiencePageProps {
  params: Promise<{ account: string; id: string }>;
}

async function AddAudiencePage({ params }: AddAudiencePageProps) {
  const { id } = await params;

  const client = getSupabaseServerClient();
  const service = createAudienceService(client);

  const audience = await service.getAudienceById(id);

  return (
    <AudienceFiltersForm
      defaultValues={audience.filters}
      audienceName={audience.name}
    />
  );
}

export default withI18n(AddAudiencePage);
