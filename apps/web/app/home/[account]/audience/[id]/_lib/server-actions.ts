'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';

import { typesenseClient } from '~/lib/typesense/client';

export const searchPremadeListsAction = enhanceAction(
  async ({ search, businessType }) => {
    const searchResponse = await typesenseClient
      .collections<{
        intent: string;
        b2b: boolean;
      }>('intents')
      .documents()
      .search({
        q: search,
        query_by: 'intent',
        filter_by: `b2b:=${businessType === 'B2B'}`,
        per_page: 20,
      });

    return searchResponse.hits?.map((hit) => hit.document.intent) ?? [];
  },
  {
    schema: z.object({
      search: z.string(),
      businessType: z.enum(['B2B', 'B2C']),
    }),
  },
);
