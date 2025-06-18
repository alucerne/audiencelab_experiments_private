import { SupabaseClient } from '@supabase/supabase-js';

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
      throw new Error('Error fetching credits');
    }

    return {
      enrichment: {
        monthlyMax: data.monthly_enrichment_limit,
        currentCount: data.current_enrichment,
        sizeLimit: data.enrichment_size_limit,
      },
      audience: {
        maxLists: data.monthly_audience_limit,
        currentCount: data.current_audience,
        sizeLimit: data.audience_size_limit,
      },
      audienceFilters: {
        maxCustomInterests: data.max_custom_interests,
        currentCustom: data.current_custom,
        b2bAccess: data.b2b_access,
        intentAccess: data.intent_access,
      },
      pixel: {
        maxPixels: data.monthly_pixel_limit,
        currentCount: data.current_pixel,
        sizeLimit: data.pixel_size_limit,
      },
    };
  }

  async getAudienceLimits({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('*, account:account_id (restricted)')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error('Error fetching credits');
    }

    return {
      canCreate:
        !data.account.restricted &&
        data.monthly_audience_limit > data.current_audience,
      canCreateCustomInterests:
        !data.account.restricted &&
        data.max_custom_interests > data.current_custom,
      b2bAccess: !data.account.restricted && data.b2b_access,
      intentAccess: !data.account.restricted && data.intent_access,
      audienceSizeLimit: data.audience_size_limit,
    };
  }

  async canCreatePixel({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('*, account:account_id (restricted)')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error('Error fetching credits');
    }

    return {
      enabled:
        !data.account.restricted &&
        data.monthly_pixel_limit > data.current_pixel,
      sizeLimit: data.pixel_size_limit,
    };
  }

  async canCreateEnrichment({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('*, account:account_id (restricted)')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error('Error fetching credits');
    }

    return {
      enabled:
        !data.account.restricted &&
        data.monthly_enrichment_limit > data.current_enrichment,
      sizeLimit: data.enrichment_size_limit,
    };
  }
}
