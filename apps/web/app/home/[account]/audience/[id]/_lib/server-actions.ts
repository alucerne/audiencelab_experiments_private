'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const searchPremadeListsAction = enhanceAction(
  async ({ search, businessType }) => {
    const client = getSupabaseServerClient();

    const { data: results, error } = await client
      .from('interests')
      .select('intent')
      .ilike('intent', `%${search}%`)
      .eq('b2b', businessType === 'B2B')
      .limit(20);

    if (error) throw error;

    return results.map((result) => result.intent);
  },
  {
    schema: z.object({
      search: z.string(),
      businessType: z.enum(['B2B', 'B2C']),
    }),
  },
);
