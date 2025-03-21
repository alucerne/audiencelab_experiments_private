'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceService } from '~/lib/audience/audience.service';
import { createCreditsService } from '~/lib/credits/credits.service';
import { getIntentNames } from '~/lib/typesense/intents/queries';

export const searchPremadeListsAction = enhanceAction(
  async (data) => {
    return getIntentNames({ ...data, typos: 0 });
  },
  {
    schema: z.object({
      search: z.string(),
      b2b: z.boolean(),
    }),
  },
);

export const getCustomInterestsAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    return service.getCustomInterests({
      accountId: data.accountId,
    });
  },
  {
    schema: z.object({
      accountId: z.string(),
    }),
  },
);

export const createCustomInterestAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const credits = createCreditsService(client);

    const limits = await credits.getAudienceLimits({
      accountId: data.accountId,
    });

    if (!limits.canCreateCustomInterests) {
      throw new Error('You have reached your custom interest limit.');
    }

    const service = createAudienceService(client);

    return service.createCustomInterest(data);
  },
  {
    schema: z.object({
      accountId: z.string(),
      topic: z.string(),
      description: z.string(),
    }),
  },
);
