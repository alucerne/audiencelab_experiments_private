'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceService } from '~/lib/audience/audience.service';
import { createAudienceSyncService } from '~/lib/integration-app/audience-sync.service';
import { NewSyncFormSchema } from '~/lib/integration-app/schema/new-sync-form.schema';

export const getAudienceIdsAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    return service.getAudienceIds(data);
  },
  {
    schema: z.object({
      accountId: z.string(),
    }),
  },
);

export const getAudienceRefreshDetailsAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    return service.getRefreshDetails(data);
  },
  {
    schema: z.object({
      audienceId: z.string(),
    }),
  },
);

export const createSyncAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);
    const syncService = createAudienceSyncService(client);

    await Promise.all([
      service.scheduleRefresh({
        accountId: data.accountId,
        audienceId: data.audienceId,
        interval: Number(data.refreshInterval),
      }),
      syncService.createAudienceSync({
        accountId: data.accountId,
        audienceId: data.audienceId,
        integrationKey: data.integration.integrationKey,
        fbAdAccountId: data.integration.fbAdAccountId,
        fbAudienceId: data.integration.fbAudienceId,
      }),
    ]);

    //!call api to start sync and create sync job

    revalidatePath('/home/[account]', 'page');
    revalidatePath('/home/[account]/sync');
  },
  {
    schema: NewSyncFormSchema.extend({
      accountId: z.string(),
    }),
  },
);
