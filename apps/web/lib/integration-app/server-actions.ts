'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceSyncService } from './audience-sync.service';
import { generateIntegrationToken } from './utils';

export const generateIntegrationTokenAction = enhanceAction(
  async (auth) => {
    return generateIntegrationToken(auth);
  },
  {
    schema: z.object({
      customerId: z.string(),
      customerName: z.string(),
    }),
  },
);

export const deleteSyncAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceSyncService(client);

    await service.deleteSync({
      syncId: data.id,
    });

    revalidatePath('/home/[account]/sync', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);
