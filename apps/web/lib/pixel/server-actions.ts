'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createPixelService } from './pixel.service';
import { createPixelFormSchema } from './schema/create-pixel-form.schema';

export const createPixelAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createPixelService(client);
    const pixel = await service.createPixel({
      accountId: data.accountId,
      websiteName: data.pixelData.websiteName,
      websiteUrl: data.pixelData.websiteUrl,
      webhookUrl: data.pixelData.webhookUrl,
    });

    revalidatePath('/home/[account]/pixel', 'page');

    return pixel;
  },
  {
    schema: z.object({
      accountId: z.string(),
      pixelData: createPixelFormSchema,
    }),
  },
);

export const deletePixelAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createPixelService(client);

    await service.deletePixel({
      id: data.id,
      delivrPixelId: data.pixelId,
      accountId: data.accountId,
    });

    revalidatePath('/home/[account]/pixel', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
      pixelId: z.string(),
      accountId: z.string(),
    }),
  },
);

export const setPixelWebhookAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createPixelService(client);

    await service.setWebhook({
      id: data.pixelId,
      webhookUrl: data.webhookUrl,
    });

    revalidatePath('/home/[account]/pixel', 'page');
  },
  {
    schema: z.object({
      pixelId: z.string(),
      webhookUrl: z.string().trim().url().nullable(),
    }),
  },
);
