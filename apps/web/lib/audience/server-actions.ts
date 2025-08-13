'use server';

import { revalidatePath } from 'next/cache';

import { format } from 'date-fns';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import miscConfig from '~/config/misc.config';

import { createCreditsService } from '../credits/credits.service';
import { get4EyesIntentIds } from '../typesense/intents/queries';
import { createAudienceService } from './audience.service';
import { audienceFiltersFormSchema } from './schema/audience-filters-form.schema';
import { zAudienceFilters, AudienceFilters } from './schema/boolean-filters.schema';
import { booleanToQueries } from './boolean-transform';
import { mapFilters } from './utils';

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
    console.log('Server action received data:', data);
    const client = getSupabaseServerClient();
    const credits = createCreditsService(client);

    // Handle both simple and boolean filter modes
    let processedFilters: any;
    let isBooleanMode = false;

    // Check if this is a boolean filter structure
    if (data.filters && typeof data.filters === 'object' && 'mode' in data.filters) {
      console.log('Processing boolean filter structure');
      // This is the new boolean filter format
      const booleanValidation = zAudienceFilters.safeParse(data.filters);
      if (booleanValidation.success) {
        const audienceFilters = booleanValidation.data;
        console.log('Boolean validation successful:', audienceFilters);
        
        if (audienceFilters.mode === 'boolean' && audienceFilters.boolean?.expression) {
          console.log('Processing boolean expression:', audienceFilters.boolean.expression);
          // Process boolean expression
          const queries = booleanToQueries(audienceFilters.boolean.expression);
          console.log('Boolean queries generated:', queries);
          processedFilters = {
            ...audienceFilters.simple, // Keep simple filters for backward compatibility
            _booleanQueries: queries // Store the processed queries
          };
          isBooleanMode = true;
        } else {
          console.log('Falling back to simple mode');
          // Fall back to simple mode
          processedFilters = audienceFilters.simple || data.filters;
        }
      } else {
        console.error('Boolean validation failed:', booleanValidation.error);
        throw new Error('Invalid boolean filter format');
      }
    } else {
      console.log('Processing simple filter structure');
      // This is the old simple filter format
      processedFilters = data.filters;
    }

    const limits = await credits.getAudienceLimits({
      accountId: data.accountId,
    });

    // Check B2B access for boolean mode
    if (isBooleanMode) {
      if (!limits.b2bAccess) {
        throw new Error('You do not have access to B2B audiences.');
      }
    } else {
      // Check B2B access for simple mode if B2B filters are used
      if (!limits.b2bAccess && processedFilters.audience.b2b) {
        throw new Error('You do not have access to B2B audiences.');
      }
    }

    if (!limits.intentAccess && processedFilters.segment.length > 0) {
      throw new Error('You do not have access to intent audiences.');
    }

    console.log('Calling audience service with processedFilters:', processedFilters);
    const service = createAudienceService(client);

    await service.generateAudience({
      accountId: data.accountId,
      audienceId: data.audienceId,
      filters: processedFilters,
      limit: limits.audienceSizeLimit,
    });

    if (data.hasSegmentChanged) {
      const client = getSupabaseServerAdminClient();
      const adminCredits = createCreditsService(client);

      await adminCredits.incrementCurrentAudience({
        accountId: data.accountId,
      });
    }

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      audienceId: z.string(),
      filters: z.any(), // Allow both simple and boolean formats
      hasSegmentChanged: z.boolean().optional(),
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
  async ({ accountId, id, filters }) => {
    const logger = await getLogger();
    const ctx = {
      name: 'audience.preview',
      accountId,
      audienceId: id,
    };
    logger.info(ctx, 'Starting preview audience generation');

    // Handle both simple and boolean filter modes
    let processedFilters: any;
    let isBooleanMode = false;

    // Check if this is a boolean filter structure
    if (filters && typeof filters === 'object' && 'mode' in filters) {
      // This is the new boolean filter format
      const booleanValidation = zAudienceFilters.safeParse(filters);
      if (booleanValidation.success) {
        const audienceFilters = booleanValidation.data;
        
        if (audienceFilters.mode === 'boolean' && audienceFilters.boolean?.expression) {
          // Process boolean expression
          const queries = booleanToQueries(audienceFilters.boolean.expression);
          processedFilters = {
            ...audienceFilters.simple, // Keep simple filters for backward compatibility
            _booleanQueries: queries // Store the processed queries
          };
          isBooleanMode = true;
        } else {
          // Fall back to simple mode
          processedFilters = audienceFilters.simple || filters;
        }
      } else {
        throw new Error('Invalid boolean filter format');
      }
    } else {
      // This is the old simple filter format
      processedFilters = filters;
    }

    const intentIds = await get4EyesIntentIds({
      keywords: processedFilters.segment,
      audienceType: processedFilters.audience.type,
    });
    logger.info({ ...ctx, intentIds }, 'Got audience segments/intents');

    const client = getSupabaseServerClient();
    const service = createAudienceService(client);
    const credits = createCreditsService(client);

    const [audienceFilters, limits] = await Promise.all([
      service.getAudienceFiltersApiBody({ filters: processedFilters, intentIds }),
      credits.getAudienceLimits({ accountId }),
    ]);

    const fullTimestamp = Number(
      `${format(new Date(), 'T')}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`,
    );
    const apiBody = {
      ...audienceFilters,
      jobId: `${id}_${fullTimestamp}`,
      startTime: fullTimestamp,
      limit: limits.audienceSizeLimit,
    };

    logger.info(
      {
        ...ctx,
        apiUrl: `${miscConfig.audienceApiUrl}/audience/search`,
        apiBody,
      },
      'Calling audience search API',
    );

    const response = await fetch(
      `${miscConfig.audienceApiUrl}/audience/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
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
      accountId: z.string(),
      id: z.string(),
      filters: z.any(), // Allow both simple and boolean formats
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

export const searchCitiesAction = enhanceAction(
  async ({ search }) => {
    const { default: cities } = await import('./filters-mappings/cities.json');

    const filteredCities = cities.filter((city) =>
      city.toLowerCase().includes(search.toLowerCase()),
    );

    return filteredCities.slice(0, 20);
  },
  {
    schema: z.object({
      search: z.string(),
    }),
  },
);

export const searchBatchCitiesAction = enhanceAction(
  async ({ search: searchTokens }: { search: string[] }) => {
    const { default: cities } = await import('./filters-mappings/cities.json');

    const validTokens = searchTokens.filter((token) =>
      cities.some((city: string) => city.toLowerCase() === token.toLowerCase()),
    );
    return validTokens;
  },
  {
    schema: z.object({
      search: z.array(z.string()),
    }),
  },
);

export const searchZipsAction = enhanceAction(
  async ({ search }) => {
    const { default: zips } = await import('./filters-mappings/zips.json');

    return zips
      .filter((zip) => zip.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 20);
  },
  {
    schema: z.object({
      search: z.string(),
    }),
  },
);

export const searchBatchZipsAction = enhanceAction(
  async ({ search: searchTokens }: { search: string[] }) => {
    const { default: zips } = await import('./filters-mappings/zips.json');
    const validTokens = searchTokens.filter((token) =>
      zips.some((zip: string) => zip.toLowerCase() === token.toLowerCase()),
    );
    return validTokens;
  },
  {
    schema: z.object({
      search: z.array(z.string()),
    }),
  },
);

export const updateAudienceNameAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createAudienceService(client);

    await service.updateAudienceName({
      audienceId: data.audienceId,
      name: data.name,
    });

    revalidatePath('/home/[account]/audience/[id]', 'page');
    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      audienceId: z.string(),
      name: z.string(),
    }),
  },
);
