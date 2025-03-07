import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '~/lib/database.types';

import { typesenseClient } from '../typesense/client';
import { audienceFiltersFormSchema } from './schema/audience-filters-form.schema';

export function createAudienceService(client: SupabaseClient<Database>) {
  return new AudienceService(client);
}

export type AudienceList = Awaited<
  ReturnType<AudienceService['getAudience']>
>['data'][number];

class AudienceService {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getAudience() {
    const { data, error } = await this.client
      .from('audience')
      .select(
        `
        *,
        enqueue_job(*)
      `,
      )
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
  }: {
    accountId: string;
    audienceId: string;
    filters: z.infer<typeof audienceFiltersFormSchema>;
  }) {
    const [interests, audience, job] = await Promise.all([
      typesenseClient
        .collections<{
          intent_id: string;
          intent: string;
        }>('intents')
        .documents()
        .search({
          q: '*',
          query_by: 'intent',
          filter_by: `intent:=[${filters.segment.join(',')}]`,
          per_page: 50,
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

    filters.segment = Array.from(
      new Set(
        interests.hits?.map((hit) => `4eyes_${hit.document.intent_id}`) || [],
      ),
    );

    const response = await fetch(
      'https://v3-audience-job-72802495918.us-east1.run.app/audience/enqueue',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filters,
          jobId: job.data.id,
        }),
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

    return enqueue;
  }

  async deleteAudience(params: { audienceId: string }) {
    const { error } = await this.client
      .from('audience')
      .delete()
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
}
