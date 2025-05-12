'use server';

import jwt, { Algorithm } from 'jsonwebtoken';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceSyncService } from './audience-sync.service';
import { revalidatePath } from 'next/cache';

const WORKSPACE_KEY = 'd431f2f3-9e1d-4d60-ae27-b64e82d87a81';
const WORKSPACE_SECRET =
  '964638ae0cb0501e0022b914cd7315f78ad8b51de8bebf942ce15f3b2c79bbb6';

interface TokenData {
  id: string;
  name: string;
}

export const generateIntegrationToken = enhanceAction(
  async (auth) => {
    const tokenData: TokenData = {
      id: auth.customerId,
      name: auth.customerName,
    };

    const options = {
      issuer: WORKSPACE_KEY,
      expiresIn: 7200,
      algorithm: 'HS512' as Algorithm,
    };

    return jwt.sign(tokenData, WORKSPACE_SECRET!, options);
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
