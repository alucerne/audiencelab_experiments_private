import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@kit/supabase/database';

import { AdminCreditsFormSchema } from '../schema/admin-credits-form.schema';
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

  async getSignupLinks(whiteLabelId?: string) {
    let query = this.client
      .from('signup_codes')
      .select(
        `
        *,
        signup_code_usages (
          id,
          created_at,
          updated_at,
          accounts!account_id (
            id,
            name,
            email
          )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (whiteLabelId) {
      query = query.eq('whitelabel_host_account_id', whiteLabelId);
    } else {
      query = query.is('whitelabel_host_account_id', null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch signup links: ${error.message}`);
    }

    return data;
  }

  async createSignupLink({
    signup,
    permissions,
  }: z.infer<typeof AdminSignupLinkFormSchema>) {
    const { data, error } = await this.client
      .from('signup_codes')
      .insert({
        name: signup.name,
        code: signup.code,
        max_usage: signup.max_usage,
        expires_at: signup.expires_at?.toISOString(),
        permissions,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create signup link: ${error.message}`);
    }

    return data;
  }

  async disableSignupLink(id: string) {
    const { error } = await this.client
      .from('signup_codes')
      .update({
        enabled: false,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to disable signup link: ${error.message}`);
    }
  }

  async updatePermissions({
    id,
    ...data
  }: z.infer<typeof AdminCreditsFormSchema>) {
    const { error } = await this.client
      .from('signup_codes')
      .update({
        permissions: data,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update permissions: ${error.message}`);
    }
  }
}
