'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

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
import { AdminSignupLinkFormSchema } from './schema/admin-signup-link-form.schema';
import { createAdminAccountsService } from './services/admin-accounts.service';
import { createAdminAuthUserService } from './services/admin-auth-user.service';
import { createAdminSignupLinksService } from './services/admin-signup-links.service';
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

export const createSignupLinkAction = enhanceAction(
  async (data) => {
    const adminClient = getSupabaseServerAdminClient();
    const service = createAdminSignupLinksService(adminClient);

    const signupLink = await service.createSignupLink(data);

    revalidatePath('/admin/signup-links', 'page');

    return signupLink;
  },
  {
    schema: AdminSignupLinkFormSchema,
  },
);

export const disableSignupLinkAction = enhanceAction(
  async ({ id }) => {
    const adminClient = getSupabaseServerAdminClient();
    const service = createAdminSignupLinksService(adminClient);

    await service.disableSignupLink(id);

    revalidatePath('/admin/signup-links', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);
