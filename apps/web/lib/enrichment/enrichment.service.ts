import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/lib/database.types';

export function createEnrichmentService(client: SupabaseClient<Database>) {
  return new EnrichmentService(client);
}

class EnrichmentService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getEnrichments(params: { accountId: string }) {
    const { data, error } = await this.client
      .from('enrichment')
      .select('*')
      .eq('account_id', params.accountId);

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteEnrichment(params: { enrichmentId: string }) {
    const { error } = await this.client
      .from('enrichment')
      .delete()
      .eq('id', params.enrichmentId);

    if (error) {
      throw error;
    }
  }
}
