import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';
import { Database } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export function createCreateTeamAccountService(
  client: SupabaseClient<Database>,
) {
  return new CreateTeamAccountService(client);
}

class CreateTeamAccountService {
  private readonly namespace = 'accounts.create-team-account';

  constructor(private readonly client: SupabaseClient<Database>) {}

  async createNewOrganizationAccount(params: { name: string; userId: string }) {
    const logger = await getLogger();
    const ctx = { ...params, namespace: this.namespace };

    logger.info(ctx, `Creating new team account...`);

    const { error, data } = await this.client.rpc('create_team_account', {
      account_name: params.name,
    });

    if (error || !data?.id) {
      logger.error(
        {
          error,
          ...ctx,
        },
        `Error creating team account`,
      );
      throw new Error('Error creating team account');
    }

    const adminClient = getSupabaseServerAdminClient();

    const teamAccountId = data.id;
    logger.info(ctx, `Team account created with ID: ${teamAccountId}`);

    const { data: usage, error: usageError } = await adminClient
      .from('signup_code_usages')
      .select(
        `
        signup_codes (
          permissions,
          whitelabel_host_account_id
        )
      `,
      )
      .eq('account_id', params.userId)
      .limit(1)
      .maybeSingle();

    if (usageError) {
      logger.error(
        {
          error: usageError,
          ...ctx,
        },
        `Error fetching signup code usage`,
      );
      throw new Error('Error fetching signup code usage');
    }

    if (usage?.signup_codes?.permissions) {
      const permissionsSchema = z.object({
        audience_size_limit: z.coerce.number().int().min(0),
        b2b_access: z.boolean().default(false),
        enrichment_size_limit: z.coerce.number().int().min(0),
        intent_access: z.boolean().default(false),
        monthly_audience_limit: z.coerce.number().int().min(0),
        max_custom_interests: z.coerce.number().int().min(0),
        monthly_enrichment_limit: z.coerce.number().int().min(0),
        pixel_size_limit: z.coerce.number().int().min(0),
        monthly_pixel_limit: z.coerce.number().int().min(0),
      });

      const parsedPermissions = permissionsSchema.parse(
        usage.signup_codes.permissions,
      );

      logger.info(
        ctx,
        `Using signup code permissions: ${JSON.stringify(parsedPermissions)}`,
      );

      const { error: insertError } = await adminClient
        .from('credits')
        .update({ ...parsedPermissions })
        .eq('account_id', teamAccountId);

      if (insertError) {
        logger.error(
          {
            error: insertError,
            ...ctx,
          },
          `Failed to create credits entry for account`,
        );
        throw new Error('Error creating credits for account');
      }

      logger.info(
        ctx,
        `Credits successfully created for account ${teamAccountId}`,
      );

      if (usage.signup_codes.whitelabel_host_account_id) {
        const { error: whiteLabelError } = await adminClient
          .from('accounts')
          .update({
            whitelabel_host_account_id:
              usage.signup_codes.whitelabel_host_account_id,
          })
          .eq('id', teamAccountId);

        if (whiteLabelError) {
          logger.error(
            {
              error: whiteLabelError,
              ...ctx,
            },
            `Failed to set whitelabel host account ID for team account`,
          );
          throw new Error('Error setting whitelabel host account ID');
        }

        const { error: creditsError } = await adminClient
          .from('credits')
          .update({
            whitelabel_host_account_id:
              usage.signup_codes.whitelabel_host_account_id,
          })
          .eq('account_id', teamAccountId);

        if (creditsError) {
          logger.error(
            {
              error: creditsError,
              ...ctx,
            },
            `Failed to set whitelabel host account ID for credits`,
          );
          throw new Error(
            'Error setting whitelabel host account ID for credits',
          );
        }
      }
    }

    return { data, error };
  }
}
