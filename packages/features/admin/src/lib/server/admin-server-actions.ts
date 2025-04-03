'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { enhanceAction } from '@kit/next/actions';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  BanUserSchema,
  DeleteAccountSchema,
  DeleteUserSchema,
  ImpersonateUserSchema,
  ReactivateUserSchema,
} from './schema/admin-actions.schema';
import { AdminCreditsFormSchema } from './schema/admin-credits-form.schema';
import { AdminNewTeamFormSchema } from './schema/admin-new-team-form.schema';
import { createAdminAccountsService } from './services/admin-accounts.service';
import { createAdminAuthUserService } from './services/admin-auth-user.service';
import { adminAction } from './utils/admin-action';

/**
 * @name banUserAction
 * @description Ban a user from the system.
 */
export const banUserAction = adminAction(
  enhanceAction(
    async ({ userId }) => {
      const service = getAdminAuthService();
      const logger = await getLogger();

      logger.info({ userId }, `Super Admin is banning user...`);

      await service.banUser(userId);

      logger.info({ userId }, `Super Admin has successfully banned user`);

      revalidateAdmin();

      return {
        success: true,
      };
    },
    {
      schema: BanUserSchema,
    },
  ),
);

/**
 * @name reactivateUserAction
 * @description Reactivate a user in the system.
 */
export const reactivateUserAction = adminAction(
  enhanceAction(
    async ({ userId }) => {
      const service = getAdminAuthService();
      const logger = await getLogger();

      logger.info({ userId }, `Super Admin is reactivating user...`);

      await service.reactivateUser(userId);

      logger.info({ userId }, `Super Admin has successfully reactivated user`);

      revalidateAdmin();

      return {
        success: true,
      };
    },
    {
      schema: ReactivateUserSchema,
    },
  ),
);

/**
 * @name impersonateUserAction
 * @description Impersonate a user in the system.
 */
export const impersonateUserAction = adminAction(
  enhanceAction(
    async ({ userId }) => {
      const service = getAdminAuthService();
      const logger = await getLogger();

      logger.info({ userId }, `Super Admin is impersonating user...`);

      return await service.impersonateUser(userId);
    },
    {
      schema: ImpersonateUserSchema,
    },
  ),
);

/**
 * @name deleteUserAction
 * @description Delete a user from the system.
 */
export const deleteUserAction = adminAction(
  enhanceAction(
    async ({ userId }) => {
      const service = getAdminAuthService();
      const logger = await getLogger();

      logger.info({ userId }, `Super Admin is deleting user...`);

      await service.deleteUser(userId);

      logger.info({ userId }, `Super Admin has successfully deleted user`);

      revalidateAdmin();

      return redirect('/admin/users');
    },
    {
      schema: DeleteUserSchema,
    },
  ),
);

/**
 * @name deleteAccountAction
 * @description Delete an account from the system.
 */
export const deleteAccountAction = adminAction(
  enhanceAction(
    async ({ accountId }) => {
      const service = getAdminAccountsService();
      const logger = await getLogger();

      logger.info({ accountId }, `Super Admin is deleting account...`);

      await service.deleteAccount(accountId);

      logger.info(
        { accountId },
        `Super Admin has successfully deleted account`,
      );

      revalidateAdmin();

      return redirect('/admin/users');
    },
    {
      schema: DeleteAccountSchema,
    },
  ),
);

function getAdminAuthService() {
  const client = getSupabaseServerClient();
  const adminClient = getSupabaseServerAdminClient();

  return createAdminAuthUserService(client, adminClient);
}

function getAdminAccountsService() {
  const adminClient = getSupabaseServerAdminClient();

  return createAdminAccountsService(adminClient);
}

function revalidateAdmin() {
  revalidatePath('/admin', 'layout');
}

export const updateTeamPermissionsAction = enhanceAction(
  async ({ id, ...data }) => {
    const adminClient = getSupabaseServerAdminClient();

    const { error } = await adminClient
      .from('credits')
      .update(data)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/home/[account]/usage', 'page');
    revalidatePath('/admin/users/[id]', 'page');
  },
  {
    schema: AdminCreditsFormSchema,
  },
);

export const createNewTeamAction = enhanceAction(
  async (data) => {
    const adminClient = getSupabaseServerAdminClient();

    const logger = await getLogger();

    logger.info(
      {
        name: 'signup',
        email: data.user_email,
      },
      'Inviting user from signup ...',
    );

    const { data: userData, error } =
      await adminClient.auth.admin.inviteUserByEmail(data.user_email, {
        redirectTo: data.redirect_to,
      });

    if (error) {
      logger.error(
        {
          name: 'signup',
          error,
          email: data.user_email,
        },
        `Failed to invite user from signup`,
      );

      throw new Error('Failed to invite user');
    }

    logger.info(
      {
        email: data.user_email,
      },
      `Invited user from signup. Creating team with permissions...`,
    );

    const { error: teamError, data: teamData } = await adminClient
      .from('accounts')
      .insert({
        name: data.user_team_name,
        is_personal_account: false,
        primary_owner_user_id: userData.user.id,
      })
      .select()
      .single();

    if (teamError) {
      logger.error(
        {
          error: teamError,
          name: 'signup',
          email: data.user_email,
          account_name: data.user_team_name,
        },
        `Error creating team account`,
      );

      throw new Error('Error creating team account');
    } else {
      console.log('teamData', teamData);

      logger.info(
        {
          name: 'signup',
          email: data.user_email,
          account_name: data.user_team_name,
        },
        `Team account created successfully`,
      );
    }

    const { data: role, error: roleError } = await adminClient.rpc(
      'get_upper_system_role',
    );

    if (roleError) {
      logger.error(
        {
          error: roleError,
          name: 'signup',
          email: data.user_email,
          account_name: data.user_team_name,
        },
        `Error getting role for user`,
      );
      throw new Error('Error getting role for user');
    }

    await adminClient.from('accounts_memberships').insert({
      account_id: teamData.id,
      user_id: userData.user.id,
      account_role: role,
    });

    logger.info(
      {
        name: 'signup',
        email: data.user_email,
        account_name: data.user_team_name,
      },
      `User invited and team created successfully`,
    );

    await adminClient
      .from('credits')
      .update({
        max_audience_lists: data.max_audience_lists,
        max_custom_interests: data.max_custom_interests,
        audience_size_limit: data.audience_size_limit,
        enrichment_size_limit: data.enrichment_size_limit,
        monthly_enrichment_limit: data.monthly_enrichment_limit,
        b2b_access: data.b2b_access,
        intent_access: data.intent_access,
      })
      .eq('account_id', teamData.id);

    revalidatePath('/admin', 'page');
    revalidatePath('/admin/users', 'page');
  },
  {
    schema: AdminNewTeamFormSchema,
  },
);
