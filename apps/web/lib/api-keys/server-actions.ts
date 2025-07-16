'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createApiKeysService } from './api-keys.service';

export const createApiKeyAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createApiKeysService(client);

    const { key } = await service.createApiKey({
      name: data.name,
      accountId: data.accountId,
      scopes: [],
    });

    revalidatePath('/home/[account]/api-keys', 'page');

    if (!key) {
      throw new Error('Failed to create API key');
    }

    return key;
  },
  {
    schema: z.object({
      name: z.string(),
      accountId: z.string(),
    }),
  },
);
