import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/lib/database.types';

export function createAudienceSyncService(client: SupabaseClient<Database>) {
  return new AudienceSyncService(client);
}

export type AudienceSyncList = Awaited<
  ReturnType<AudienceSyncService['getAudienceSyncs']>
>;

class AudienceSyncService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAudienceSyncs(params: { accountId: string }) {
    const { data, error } = await this.client
      .from('audience_sync')
      .select('*, audience(name, next_scheduled_refresh)')
      .eq('account_id', params.accountId);

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteSync({ syncId }: { syncId: string }) {
    const { error } = await this.client
      .from('audience_sync')
      .delete()
      .eq('id', syncId);

    if (error) {
      throw error;
    }
  }
}
