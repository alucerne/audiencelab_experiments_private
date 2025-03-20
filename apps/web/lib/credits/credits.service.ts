import { SupabaseClient } from '@supabase/supabase-js';

import { endOfMonth, startOfMonth } from 'date-fns';

import { Database } from '~/lib/database.types';

export function createCreditsService(client: SupabaseClient<Database>) {
  return new CreditsService(client);
}

export type CreditMetrics = Awaited<
  ReturnType<CreditsService['getCreditsUsage']>
>;

class CreditsService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getCreditsUsage({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw error;
    }

    const now = new Date();
    const startDate = startOfMonth(now).toISOString();
    const endDate = endOfMonth(now).toISOString();

    const [jobEnrichResult, audienceResult, interestsResult] =
      await Promise.all([
        this.client
          .from('job_enrich')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', accountId)
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        this.client
          .from('audience')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', accountId),
        this.client
          .from('interests_custom')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', accountId),
      ]);

    if (
      jobEnrichResult.error ||
      audienceResult.error ||
      interestsResult.error
    ) {
      throw new Error('Error fetching counts');
    }

    return {
      enrichment: {
        monthlyMax: data.monthly_enrichment_limit,
        currentCount: jobEnrichResult.count ?? 0,
        sizeLimit: data.enrichment_size_limit,
      },
      audience: {
        maxLists: data.max_audience_lists,
        currentCount: audienceResult.count ?? 0,
        sizeLimit: data.audience_size_limit,
      },
      audienceFilters: {
        maxCustomInterests: data.max_custom_interests,
        currentCustom: interestsResult.count ?? 0,
        b2bAccess: data.b2b_access,
        intentAccess: data.intent_access,
      },
    };
  }
}
