import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@kit/supabase/database';

import { AdminCreditsSchema } from '../schema/admin-credits-form.schema';

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

  async enableWhiteLabel({
    accountId,
    permissions,
  }: {
    accountId: string;
    permissions: z.infer<typeof AdminCreditsSchema>;
  }) {
    const { error } = await this.adminClient
      .from('whitelabel_credits')
      .insert({
        account_id: accountId,
        ...permissions,
      })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }
  }
}
