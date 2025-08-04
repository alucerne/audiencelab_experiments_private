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
      .select('*, accounts!account_id (restricted)')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error('Error fetching credits');
    }

    return {
      canCreate:
        !data.accounts.restricted &&
        data.monthly_audience_limit > data.current_audience,
      canCreateCustomInterests:
        !data.accounts.restricted &&
        data.max_custom_interests > data.current_custom,
      b2bAccess: !data.accounts.restricted && data.b2b_access,
      intentAccess: !data.accounts.restricted && data.intent_access,
      audienceSizeLimit: data.audience_size_limit,
    };
  }

  async canCreatePixel({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('*, accounts!account_id (restricted)')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error('Error fetching credits');
    }

    return {
      enabled:
        !data.accounts.restricted &&
        data.monthly_pixel_limit > data.current_pixel,
      sizeLimit: data.pixel_size_limit,
    };
  }

  async canCreateEnrichment({ accountId }: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits')
      .select('*, accounts!account_id (restricted)')
      .eq('account_id', accountId)
      .single();

    if (error) {
      throw new Error('Error fetching credits');
    }

    return {
      enabled:
        !data.accounts.restricted &&
        data.monthly_enrichment_limit > data.current_enrichment,
      sizeLimit: data.enrichment_size_limit,
    };
  }

  async incrementCurrentAudience({ accountId }: { accountId: string }) {
    const { data, error: selectError } = await this.client
      .from('credits')
      .select('current_audience, monthly_audience_limit')
      .eq('account_id', accountId)
      .single();

    if (selectError) {
      throw selectError;
    }

    if (data.current_audience >= data.monthly_audience_limit) {
      throw new Error('Monthly audience limit reached');
    }

    const { error: updateError } = await this.client
      .from('credits')
      .update({ current_audience: data.current_audience + 1 })
      .eq('account_id', accountId);

    if (updateError) {
      throw updateError;
    }
  }

  async getAgencyCreditPricing({ agencyId }: { agencyId: string }) {
    const { data, error } = await this.client
      .from('agency_credit_pricing')
      .select('*')
      .eq('agency_id', agencyId);

    if (error) {
      throw new Error('Error fetching agency credit pricing');
    }

    // Convert array to object for easier access
    const pricing: Record<string, number> = {};
    data.forEach(item => {
      pricing[item.credit_type] = item.price_per_credit_cents;
    });

    return pricing;
  }

  async purchaseOverageCredits({
    clientId,
    agencyId,
    purchases,
  }: {
    clientId: string;
    agencyId: string;
    purchases: Array<{
      creditType: 'audience' | 'enrichment' | 'pixel' | 'custom_model';
      credits: number;
      pricePerCreditCents: number;
      costPerCreditCents: number;
    }>;
  }) {
    const adminClient = this.client;

    try {
      // 1. Insert into overage_credit_purchases table
      const purchasePromises = purchases.map(purchase => 
        adminClient
          .from('overage_credit_purchases')
          .insert({
            client_id: clientId,
            agency_id: agencyId,
            credit_type: purchase.creditType,
            credits: purchase.credits,
            price_per_credit_cents: purchase.pricePerCreditCents,
            cost_per_credit_cents: purchase.costPerCreditCents,
            billed_to_client: false,
            billed_to_agency: false,
          })
      );

      // 2. Get current credit balances
      const { data: currentCredits, error: selectError } = await adminClient
        .from('credits')
        .select('current_audience, current_enrichment, current_pixel, current_custom')
        .eq('account_id', clientId)
        .single();

      if (selectError) {
        throw new Error('Failed to fetch current credit balances');
      }

      // 3. Calculate new balances
      const fieldMap = {
        audience: 'current_audience',
        enrichment: 'current_enrichment',
        pixel: 'current_pixel',
        custom_model: 'current_custom',
      };

      const updates: Record<string, number> = {};
      purchases.forEach(purchase => {
        const field = fieldMap[purchase.creditType];
        updates[field] = (currentCredits[field] || 0) + purchase.credits;
      });

      // 4. Update credit balances
      const { error: updateError } = await adminClient
        .from('credits')
        .update(updates)
        .eq('account_id', clientId);

      if (updateError) {
        throw new Error('Failed to update credit balances');
      }

      // 5. Insert purchase records
      await Promise.all(purchasePromises);

      return {
        success: true,
        totalCredits: purchases.reduce((sum, p) => sum + p.credits, 0),
        totalCost: purchases.reduce((sum, p) => sum + (p.credits * p.pricePerCreditCents), 0),
      };

    } catch (error) {
      console.error('Failed to purchase overage credits:', error);
      throw new Error('Failed to process credit purchase');
    }
  }
}
