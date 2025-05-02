import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@kit/supabase/database';

export function createAdminAccountsService(client: SupabaseClient<Database>) {
  return new AdminAccountsService(client);
}

class AdminAccountsService {
  constructor(private adminClient: SupabaseClient<Database>) {}

  async deleteAccount(accountId: string) {
    const { error } = await this.adminClient
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      throw error;
    }
  }

  async restrictAccount(accountId: string, currentlyRestricted: boolean) {
    const { error } = await this.adminClient
      .from('accounts')
      .update({ restricted: !currentlyRestricted })
      .eq('id', accountId);

    if (error) {
      throw error;
    }
  }
}
