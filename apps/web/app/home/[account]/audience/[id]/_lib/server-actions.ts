'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceService } from '~/lib/audience/audience.service';
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
