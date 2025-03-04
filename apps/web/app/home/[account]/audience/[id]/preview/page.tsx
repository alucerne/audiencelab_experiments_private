import { Suspense, use } from 'react';

import { SupabaseClient } from '@supabase/supabase-js';

import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';
import { createAudienceService } from '~/lib/audience/audience.service';
import { audienceFiltersFormSchema } from '~/lib/audience/schema/audience-filters-form.schema';
import { Database, Tables } from '~/lib/database.types';

import PreviewAudienceTable from './_components/preview-audience-table';

export const maxDuration = 60;

export default function AudiencePreviewPage({
  params,
}: {
  params: Promise<{ account: string; id: string }>;
}) {
  const account = use(params).account;
  const id = use(params).id;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Audience Preview"
        description={<AppBreadcrumbs uuidLabel="Filters" />}
      />

      <PageBody>
        <Suspense
          fallback={
            <div className="flex h-[80%] flex-col items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-4 text-sm">
                Loading preview data...
              </p>
            </div>
          }
        >
          <AudiencePreviewContent id={id} />
        </Suspense>
      </PageBody>
    </>
  );
}

function AudiencePreviewContent({ id }: { id: string }) {
  const client = getSupabaseServerClient();
  const service = createAudienceService(client);

  const audience = use(service.getAudienceById(id));
  const { result, count } = use(getPreviewAudience(client, audience));

  return <PreviewAudienceTable data={result} count={count} />;
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
      count: z.number(),
    })
    .parse(await response.json());
}
