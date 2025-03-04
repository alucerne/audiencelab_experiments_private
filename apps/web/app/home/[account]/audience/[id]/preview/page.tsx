import { use } from 'react';

import { SupabaseClient } from '@supabase/supabase-js';

import { format } from 'date-fns';
import { z } from 'zod';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';
import { createAudienceService } from '~/lib/audience/audience.service';
import { audienceFiltersFormSchema } from '~/lib/audience/schema/audience-filters-form.schema';
import { Database, Tables } from '~/lib/database.types';

import PreviewAudienceTable from './_components/preview-audience-table';

export default function AudiencePreviewPage({
  params,
}: {
  params: Promise<{ account: string; id: string }>;
}) {
  const account = use(params).account;
  const id = use(params).id;

  const client = getSupabaseServerClient();
  const service = createAudienceService(client);

  const audience = use(service.getAudienceById(id));

  const { result: previewAudience } = use(getPreviewAudience(client, audience));

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Audience Preview"
        description={<AppBreadcrumbs uuidLabel="Filters" />}
      />

      <PageBody>
        <PreviewAudienceTable data={previewAudience} />
      </PageBody>
    </>
  );
}

async function getPreviewAudience(
  client: SupabaseClient<Database>,
  audience: Tables<'audience'>,
) {
  const audienceFilters = audienceFiltersFormSchema.parse(audience.filters);

  const { data: interests, error } = await client
    .from('interests')
    .select('id, intent')
    .in('intent', audienceFilters.segment);

  if (error) {
    throw error;
  }

  audienceFilters.segment = Array.from(
    new Set(interests.map((interest) => `4eyes_${interest.id}`)),
  );

  const timestampMs = format(new Date(), 'T');
  const microPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  const fullTimestamp = Number(`${timestampMs}${microPart}`);

  const response = await fetch(
    'https://v3-audience-job-72802495918.us-east1.run.app/audience/search',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...audienceFilters,
        jobId: `${audience.id}_${fullTimestamp}`,
        startTime: fullTimestamp,
      }),
    },
  );

  return z
    .object({
      result: z.array(z.record(z.string(), z.string())),
    })
    .parse(await response.json());
}
