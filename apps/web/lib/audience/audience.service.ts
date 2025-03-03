import { SupabaseClient } from '@supabase/supabase-js';

import { Database, Json } from '~/lib/database.types';

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
      .select('*')
      .eq('id', audienceId)
      .single();

    if (error) {
      throw error;
    }

    return data;
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

  async addFilters(params: { id: string; filters: Json }) {
    const { data, error } = await this.client
      .from('audience')
      .update({
        filters: params.filters,
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateAudience(params: {
    audienceId: string;
    name: string;
    filters: Json;
  }) {
    const { data, error } = await this.client
      .from('audience')
      .update({ name: params.name })
      .eq('id', params.audienceId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
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
}
