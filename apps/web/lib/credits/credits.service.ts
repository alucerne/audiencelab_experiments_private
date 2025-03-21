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
    const now = new Date();
    const startDate = startOfMonth(now).toISOString();
    const endDate = endOfMonth(now).toISOString();

    const [credits, jobEnrich, audience, interests] = await Promise.all([
      this.client
        .from('credits')
        .select('*')
        .eq('account_id', accountId)
        .single(),
      this.client
        .from('job_enrich')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      this.client
        .from('audience')
        .select('id, enqueue_job!inner(id)', { count: 'exact', head: true })
        .eq('account_id', accountId),
      this.client
        .from('interests_custom')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId),
    ]);

    if (credits.error || jobEnrich.error || audience.error || interests.error) {
      throw new Error('Error fetching counts');
    }

    return {
      enrichment: {
        monthlyMax: credits.data.monthly_enrichment_limit,
        currentCount: jobEnrich.count ?? 0,
        sizeLimit: credits.data.enrichment_size_limit,
      },
      audience: {
        maxLists: credits.data.max_audience_lists,
        currentCount: audience.count ?? 0,
        sizeLimit: credits.data.audience_size_limit,
      },
      audienceFilters: {
        maxCustomInterests: credits.data.max_custom_interests,
        currentCustom: interests.count ?? 0,
        b2bAccess: credits.data.b2b_access,
        intentAccess: credits.data.intent_access,
      },
    };
  }

  async canCreateAudience({ accountId }: { accountId: string }) {
    const [credits, audience] = await Promise.all([
      this.client
        .from('credits')
        .select('max_audience_lists')
        .eq('account_id', accountId)
        .single(),
      this.client
        .from('audience')
        .select('id, enqueue_job!inner(id)', { count: 'exact', head: true })
        .eq('account_id', accountId),
    ]);

    if (credits.error || audience.error) {
      throw new Error('Error fetching counts');
    }

    return {
      enabled: (credits.data.max_audience_lists ?? 0) > (audience.count ?? 0),
    };
  }

  async canCreateCustomInterest({ accountId }: { accountId: string }) {
    const [credits, interests] = await Promise.all([
      this.client
        .from('credits')
        .select('max_custom_interests')
        .eq('account_id', accountId)
        .single(),
      this.client
        .from('interests_custom')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId),
    ]);

    if (credits.error || interests.error) {
      throw new Error('Error fetching counts');
    }

    return {
      enabled:
        (credits.data.max_custom_interests ?? 0) > (interests.count ?? 0),
    };
  }

  async canUseB2B({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('b2b_access')
      .eq('account_id', accountId)
      .single();

    if (error) throw error;

    return {
      enabled: data.b2b_access,
    };
  }

  async canUseIntent({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('intent_access')
      .eq('account_id', accountId)
      .single();

    if (error) throw error;

    return {
      enabled: data.intent_access,
    };
  }

  async canCreateEnrichment({ accountId }: { accountId: string }) {
    const now = new Date();
    const startDate = startOfMonth(now).toISOString();
    const endDate = endOfMonth(now).toISOString();

    const [credits, enrichment] = await Promise.all([
      this.client
        .from('credits')
        .select('monthly_enrichment_limit, enrichment_size_limit')
        .eq('account_id', accountId)
        .single(),
      this.client
        .from('job_enrich')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .gte('created_at', startDate)
        .lte('created_at', endDate),
    ]);

    if (credits.error || enrichment.error) {
      throw new Error('Error fetching counts');
    }

    return {
      enabled:
        (credits.data.monthly_enrichment_limit ?? 0) > (enrichment.count ?? 0),
      sizeLimit: credits.data.enrichment_size_limit,
    };
  }
}
