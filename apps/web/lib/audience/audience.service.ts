import { SupabaseClient } from '@supabase/supabase-js';

import { addDays, addMonths } from 'date-fns';
import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';

import miscConfig from '~/config/misc.config';
import { Database } from '~/lib/database.types';

import { get4EyesIntentIds } from '../typesense/intents/queries';
import { audienceFiltersFormSchema } from './schema/audience-filters-form.schema';
import { mapFilters } from './utils';

export function createAudienceService(client: SupabaseClient<Database>) {
  return new AudienceService(client);
}

export type AudienceList = Awaited<
  ReturnType<AudienceService['getAudience']>
>['data'][number];

class AudienceService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAudience({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('audience')
      .select(
        `
        *,
        enqueue_job(*)
      `,
      )
      .eq('account_id', accountId)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const filteredData = data
      ?.map((audience) => {
        if (audience.enqueue_job && audience.enqueue_job.length > 0) {
          const sortedJobs = [...audience.enqueue_job].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          if (sortedJobs[0]) {
            const { enqueue_job: _enqueue_job, ...rest } = audience;
            return {
              ...rest,
              enqueue_jobs: sortedJobs,
              latest_job: sortedJobs[0],
            };
          }
        }
        return null;
      })
      .filter(
        (audience): audience is NonNullable<typeof audience> =>
          audience !== null,
      );

    return {
      data: filteredData,
      count: filteredData.length,
    };
  }

  async getAudienceById(audienceId: string) {
    const { data, error } = await this.client
      .from('audience')
      .select(
        `
        *,
        enqueue_job(*)
      `,
      )
      .eq('id', audienceId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Audience with ID ${audienceId} not found`);
    }

    const { enqueue_job, ...audienceData } = data;
    let latest_job = null;

    if (enqueue_job && enqueue_job.length > 0) {
      const sortedJobs = [...enqueue_job].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      if (sortedJobs[0]) {
        latest_job = sortedJobs[0];
      }
    }

    return {
      ...audienceData,
      latest_job,
      enqueue_jobs: enqueue_job,
    };
  }

  async createAudience(params: { accountId: string; name: string }) {
    const { data, error } = await this.client
      .from('audience')
      .insert({
        account_id: params.accountId,
        name: params.name,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async generateAudience({
    accountId,
    audienceId,
    filters,
    limit,
  }: {
    accountId: string;
    audienceId: string;
    filters: z.infer<typeof audienceFiltersFormSchema>;
    limit: number;
  }) {
    const logger = await getLogger();
    const ctx = {
      name: 'audience.generate',
      accountId,
      audienceId,
    };
    logger.info(ctx, 'Starting audience generation');

    const [intentIds, audience, job] = await Promise.all([
      get4EyesIntentIds({
        keywords: filters.segment,
        audienceType: filters.audience.type,
      }),
      this.client
        .from('audience')
        .update({ filters })
        .eq('id', audienceId)
        .select('*')
        .single(),
      this.client
        .from('enqueue_job')
        .insert({
          audience_id: audienceId,
          account_id: accountId,
        })
        .select('*')
        .single(),
    ]);

    if (audience.error || job.error) {
      throw audience.error || job.error;
    }

    logger.info({ ...ctx, intentIds }, 'Got audience segments/intents');

    const audienceFilters = await this.getAudienceFiltersApiBody({
      filters,
      intentIds,
    });

    const apiBody = {
      ...audienceFilters,
      jobId: job.data.id,
      audienceId,
      accountId,
      webhook_url: audience.data.webhook_url,
      limit,
    };

    logger.info(
      {
        ...ctx,
        apiUrl: `${miscConfig.audienceApiUrl}/audience/enqueue`,
        apiBody,
      },
      'Calling audience generate API',
    );

    const response = await fetch(
      `${miscConfig.audienceApiUrl}/audience/enqueue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
      },
    );

    if (!response.ok) {
      await this.client.from('enqueue_job').delete().eq('id', job.data.id);

      const errorData = await response.json();
      throw new Error(
        `API request failed ${response.status}: ${
          errorData.message || errorData.error || JSON.stringify(errorData)
        }`,
      );
    }

    const enqueue = z
      .object({
        jobId: z.string(),
        status: z.string(),
      })
      .parse(await response.json());

    await this.client
      .from('enqueue_job')
      .update({ status: enqueue.status })
      .eq('id', job.data.id);

    logger.info(
      { ...ctx, jobId: enqueue.jobId, status: enqueue.status },
      'Audience generation started successfully.',
    );

    return enqueue;
  }

  async deleteAudience(params: { audienceId: string }) {
    const { error } = await this.client
      .from('audience')
      .update({ deleted: true })
      .eq('id', params.audienceId);

    if (error) {
      throw error;
    }
  }

  async duplicateAudience(params: { originalId: string; newName: string }) {
    const originalAudience = await this.getAudienceById(params.originalId);

    const { data, error } = await this.client
      .from('audience')
      .insert({
        account_id: originalAudience.account_id,
        name: params.newName,
        filters: originalAudience.filters,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateJob(params: {
    job_id: string;
    status?: string;
    url?: string;
    current?: number;
    total?: number;
  }) {
    const { job_id, status, url, current, total } = params;

    const { data, error } = await this.client
      .from('enqueue_job')
      .update({
        status,
        csv_url: url,
        current,
        total,
      })
      .eq('id', job_id);

    if (error) {
      throw error;
    }

    return data;
  }

  async getCustomInterests({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('interests_custom')
      .select('topic_id, topic, description, created_at, status')
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }

    return data;
  }

  async createCustomInterest({
    accountId,
    topic,
    description,
  }: {
    accountId: string;
    topic: string;
    description: string;
  }) {
    const response = await fetch(
      `${miscConfig.audienceApiUrl}/audience/topics`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: accountId,
          topic,
          description,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API request failed ${response.status}: ${
          errorData.message || errorData.error || JSON.stringify(errorData)
        }`,
      );
    }

    return z
      .object({
        status: z.string(),
        topic_id: z.string(),
      })
      .parse(await response.json());
  }

  async scheduleRefresh({
    accountId,
    audienceId,
    interval,
  }: {
    accountId: string;
    audienceId: string;
    interval: number;
  }) {
    const jobName = `refresh_audience_${audienceId.replace(/-/g, '_')}`;
    const cronExpression = this.getCronExpressionForDays(interval);

    const { error } = await this.client.rpc('create_audience_refresh_cron', {
      p_job_name: jobName,
      p_cron_expression: cronExpression,
      p_audience_id: audienceId,
      p_account_id: accountId,
      p_refresh_interval: interval,
    });

    if (error) {
      throw error;
    }
  }

  private getCronExpressionForDays(days: number) {
    switch (days) {
      case 1:
        return '0 0 * * *';
      case 3:
        return '0 0 */3 * *';
      case 7:
        return '0 0 */7 * *';
      case 14:
        return '0 0 */14 * *';
      case 30:
        return '0 0 1 * *';
      default:
        return `0 0 */${days} * *`;
    }
  }

  async unscheduleRefresh({ audienceId }: { audienceId: string }) {
    const jobName = `refresh_audience_${audienceId.replace(/-/g, '_')}`;

    const { error } = await this.client.rpc('remove_audience_cron_job', {
      p_audience_id: audienceId,
      p_job_name: jobName,
    });

    if (error) {
      throw error;
    }
  }

  async updateNextScheduledRefresh({
    audienceId,
    interval,
  }: {
    audienceId: string;
    interval: number;
  }) {
    function getStartOfUTCDay(date: Date): Date {
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
    }

    function getStartOfUTCMonth(date: Date): Date {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }
    const now = new Date();
    let nextRun: Date;

    if (interval === 30) {
      nextRun = addMonths(getStartOfUTCMonth(now), 1);
    } else {
      nextRun = addDays(getStartOfUTCDay(now), interval);
    }

    const { error } = await this.client
      .from('audience')
      .update({
        next_scheduled_refresh: nextRun.toISOString(),
      })
      .eq('id', audienceId);

    if (error) {
      throw error;
    }
  }

  async setWebhook({
    audienceId,
    webhookUrl,
  }: {
    audienceId: string;
    webhookUrl: string | null;
  }) {
    const { error } = await this.client
      .from('audience')
      .update({
        webhook_url: webhookUrl,
      })
      .eq('id', audienceId);

    if (error) {
      throw error;
    }
  }

  async getAudienceFiltersApiBody({
    filters,
    intentIds,
  }: {
    filters: z.infer<typeof audienceFiltersFormSchema>;
    intentIds: string[];
  }) {
    filters.segment = intentIds;

    const { audience: _audience, ...audienceFilters } = filters;

    filters.filters = await mapFilters(audienceFilters.filters);

    return audienceFilters;
  }

  async updateAvailableInterests() {
    const response = await fetch(miscConfig.interestsApi.url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': miscConfig.interestsApi.key,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API request failed ${response.status}: ${
          errorData.message || errorData.error || JSON.stringify(errorData)
        }`,
      );
    }

    const availableInterests = z
      .object({
        result: z.array(
          z.object({
            segment: z.string(),
            total: z.number(),
          }),
        ),
      })
      .parse(await response.json());

    const validSegments = availableInterests.result.map((item) =>
      item.segment.replace('4eyes_', ''),
    );

    if (validSegments.length === 0) return [];

    const BATCH_SIZE = 300;
    const updatedTopics: {
      account_id: string;
      topic: string | null;
      description: string;
      status: 'ready' | 'rejected';
    }[] = [];

    for (let i = 0; i < validSegments.length; i += BATCH_SIZE) {
      const batch = validSegments.slice(i, i + BATCH_SIZE);

      const { data, error } = await this.client
        .from('interests_custom')
        .update({ status: 'ready' })
        .in('topic_id', batch)
        .eq('status', 'processing')
        .select('account_id, topic, description');

      if (error) {
        throw error;
      }

      updatedTopics.push(
        ...data.map((item) => ({ ...item, status: 'ready' as const })),
      );
    }

    const taxRes = await fetch(
      `${miscConfig.delivrPixel.apiUrl}/taxonomy/core/api/intent/topic/get`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${miscConfig.delivrPixel.jwt}`,
          'X-Delivr-Client-ID': miscConfig.delivrPixel.appClientId,
          'X-Delivr-Client-Secret': miscConfig.delivrPixel.appClientSecret,
        },
      },
    );

    if (!taxRes.ok) {
      const err = await taxRes.json();
      throw new Error(
        `Taxonomy request failed ${taxRes.status}: ${err.message || JSON.stringify(err)}`,
      );
    }

    const {
      response: { topics },
    } = z
      .object({
        response: z.object({
          topics: z.array(
            z.object({
              topic_id: z.string(),
              status: z.string(),
            }),
          ),
        }),
      })
      .parse(await taxRes.json());

    const rejectedIds = topics
      .filter((t) => t.status === 'rejected')
      .map((t) => t.topic_id.replace('4eyes_', ''));

    const countsByAccount: Record<string, number> = {};

    if (rejectedIds.length) {
      for (let i = 0; i < rejectedIds.length; i += BATCH_SIZE) {
        const batch = rejectedIds.slice(i, i + BATCH_SIZE);

        const { data, error } = await this.client
          .from('interests_custom')
          .update({ status: 'rejected' })
          .in('topic_id', batch)
          .eq('status', 'processing')
          .select('account_id, topic, description');

        if (error) throw error;

        updatedTopics.push(
          ...data.map((item) => ({ ...item, status: 'rejected' as const })),
        );

        for (const row of data) {
          countsByAccount[row.account_id] =
            (countsByAccount[row.account_id] || 0) + 1;
        }
      }

      for (const [account_id, decCount] of Object.entries(countsByAccount)) {
        const { data: creditRow, error: readErr } = await this.client
          .from('credits')
          .select('current_custom')
          .eq('account_id', account_id)
          .single();
        if (readErr) throw readErr;

        const oldValue = creditRow?.current_custom ?? 0;
        const newValue = Math.max(oldValue - decCount, 0);

        const { error: updateErr } = await this.client
          .from('credits')
          .update({ current_custom: newValue })
          .eq('account_id', account_id);

        if (updateErr) throw updateErr;
      }
    }

    return updatedTopics;
  }

  async updateAudienceName({
    audienceId,
    name,
  }: {
    audienceId: string;
    name: string;
  }) {
    const { error } = await this.client
      .from('audience')
      .update({
        name,
      })
      .eq('id', audienceId);

    if (error) {
      throw error;
    }
  }

  async getAudienceIds({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('audience')
      .select('id, name, enqueue_job!inner(id)')
      .eq('account_id', accountId)
      .eq('deleted', false);

    if (error) {
      throw error;
    }

    return data;
  }

  async getRefreshDetails({ audienceId }: { audienceId: string }) {
    const { data, error } = await this.client
      .from('audience')
      .select('scheduled_refresh, refresh_interval, next_scheduled_refresh')
      .eq('id', audienceId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
