'use server';

import { revalidatePath } from 'next/cache';

import { format } from 'date-fns';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAudienceService } from './audience.service';
import { audienceFiltersFormSchema } from './schema/audience-filters-form.schema';

export const createAudienceAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
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

    const audience = await service.getAudienceById(data.id);

    return audience;
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);

export const getPreviewAudienceAction = enhanceAction(
  async ({ id, filters }) => {
    const client = getSupabaseServerClient();

    const { data: interests, error } = await client
      .from('interests')
      .select('id, intent')
      .in('intent', filters.segment);

    if (error) {
      throw error;
    }

    filters.segment = Array.from(
      new Set(interests.map((interest) => `4eyes_${interest.id}`)),
    );

    const timestampMs = format(new Date(), 'T');
    const microPart = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const fullTimestamp = Number(`${timestampMs}${microPart}`);

    const response = await fetch(
      'https://v3-audience-job-72802495918.us-east1.run.app/audience/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filters,
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
