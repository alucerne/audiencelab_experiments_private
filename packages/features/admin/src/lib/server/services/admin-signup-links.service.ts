import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@kit/supabase/database';

import { AdminSignupLinkFormSchema } from '../schema/admin-signup-link-form.schema';

export function createAdminSignupLinksService(
  client: SupabaseClient<Database>,
) {
  return new AdminSignupLinksService(client);
}

export type SignupLinkData = Awaited<
  ReturnType<AdminSignupLinksService['getSignupLinks']>
>[number];

class AdminSignupLinksService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getSignupLinks() {
    const { data, error } = await this.client
      .from('signup_codes')
      .select(
        `
        *,
        signup_code_usages (
          id,
          created_at,
          updated_at,
          account:account_id (
            id,
            name,
            email
          )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch signup links: ${error.message}`);
    }

    return data;
  }
}
