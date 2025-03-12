'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createEnrichmentService } from './enrichment.service';

export const deleteEnrichmentAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createEnrichmentService(client);

    await service.deleteEnrichment({
      enrichmentId: data.id,
    });

    revalidatePath('/home/[account]/enrichment', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);
