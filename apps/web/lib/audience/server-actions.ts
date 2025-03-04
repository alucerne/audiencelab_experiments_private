'use server';

import { revalidatePath } from 'next/cache';

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

    if (data.filters) {
      await service.generateAudience({
        accountId: data.accountId,
        audienceId: data.audienceId,
        filters: data.filters,
      });
    } else {
      const { filters } = await service.getAudienceById(data.audienceId);

      await service.generateAudience({
        accountId: data.accountId,
        audienceId: data.audienceId,
        filters: audienceFiltersFormSchema.parse(filters),
      });
    }

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      audienceId: z.string(),
      filters: audienceFiltersFormSchema.optional(),
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
