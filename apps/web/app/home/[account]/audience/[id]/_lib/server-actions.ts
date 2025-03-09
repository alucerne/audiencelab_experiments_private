'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';

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
