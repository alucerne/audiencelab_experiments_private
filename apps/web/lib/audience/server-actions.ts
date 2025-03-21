'use server';

import { revalidatePath } from 'next/cache';

import { format } from 'date-fns';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createCreditsService } from '../credits/credits.service';
import { get4EyesIntentIds } from '../typesense/intents/queries';
import { createAudienceService } from './audience.service';
import { audienceFiltersFormSchema } from './schema/audience-filters-form.schema';

export const createAudienceAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const credits = createCreditsService(client);

    const { canCreate } = await credits.getAudienceLimits({
      accountId: data.accountId,
    });

    if (!canCreate) {
      throw new Error('You have reached your audience limit.');
    }

    const service = createAudienceService(client);

    const { id } = await service.createAudience({
      accountId: data.accountId,
      name: data.name,
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');

    return { id };
  },
  {
    schema: z.object({
      accountId: z.string(),
      name: z.string(),
    }),
  },
);

export const addAudienceFiltersAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const credits = createCreditsService(client);

    const limits = await credits.getAudienceLimits({
      accountId: data.accountId,
    });

    if (!limits.b2bAccess && data.filters.audience.b2b) {
      throw new Error('You do not have access to B2B audiences.');
    } else if (!limits.intentAccess && data.filters.segment.length > 0) {
      throw new Error('You do not have access to intent audiences.');
    }

    const service = createAudienceService(client);

    await service.generateAudience({
      accountId: data.accountId,
      audienceId: data.audienceId,
      filters: data.filters,
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      audienceId: z.string(),
      filters: audienceFiltersFormSchema,
    }),
  },
);

export const duplicateAudienceAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    const { id } = await service.duplicateAudience({
      originalId: data.originalId,
      newName: data.newName,
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');

    return { id };
  },
  {
    schema: z.object({
      originalId: z.string(),
      newName: z.string(),
    }),
  },
);

export const deleteAudienceAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    await service.deleteAudience({
      audienceId: data.id,
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);

export const getAudienceByIdAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    return service.getAudienceById(data.id);
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);

export const getPreviewAudienceAction = enhanceAction(
  async ({ id, filters }) => {
    filters.segment = await get4EyesIntentIds({
      keywords: filters.segment,
      audienceType: filters.audience.type,
    });

    const { audience: _audience, ...audienceFilters } = filters;

    const fullTimestamp = Number(
      `${format(new Date(), 'T')}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`,
    );

    const response = await fetch(
      'https://v3-audience-job-72802495918.us-east1.run.app/audience/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...audienceFilters,
          jobId: `${id}_${fullTimestamp}`,
          startTime: fullTimestamp,
        }),
      },
    );

    return z
      .object({
        result: z.array(z.record(z.string(), z.string())),
        count: z.number(),
      })
      .parse(await response.json());
  },
  {
    schema: z.object({
      id: z.string(),
      filters: audienceFiltersFormSchema,
    }),
  },
);

export const scheduleAudienceRefreshAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    await service.scheduleRefresh({
      accountId: data.accountId,
      audienceId: data.audienceId,
      interval: Number(data.interval),
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      audienceId: z.string(),
      interval: z.enum(['1', '3', '7', '14', '30']),
    }),
  },
);

export const unscheduleAudienceRefreshAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    await service.unscheduleRefresh(data);

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({ audienceId: z.string() }),
  },
);

export const setAudienceWebhookAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    await service.setWebhook({
      audienceId: data.audienceId,
      webhookUrl: data.webhookUrl,
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      audienceId: z.string(),
      webhookUrl: z.string().trim().url().nullable(),
    }),
  },
);
