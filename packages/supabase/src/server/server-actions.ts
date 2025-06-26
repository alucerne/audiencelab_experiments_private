'use server';

import { redirect } from 'next/navigation';

import { z } from 'zod';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { enhanceAction } from './enhance-action';

export const signupAction = enhanceAction(
  async (data) => {
    const adminClient = getSupabaseServerAdminClient();
    const client = getSupabaseServerClient();

    if (data.code) {
      const { data: codeEntry, error: codeError } = await adminClient
        .from('signup_codes')
        .select('id, enabled, max_usage, expires_at')
        .eq('code', data.code)
        .eq('enabled', true)
        .maybeSingle();

      if (!codeEntry || codeError) {
        throw new Error('Invalid signup code');
      }

      const { count, error: countError } = await adminClient
        .from('signup_code_usages')
        .select('id', { count: 'exact', head: true })
        .eq('signup_code_id', codeEntry.id);

      if (countError) {
        throw new Error('Failed to count signup code usage');
      }

      if (
        codeEntry.max_usage !== null &&
        count &&
        count >= codeEntry.max_usage
      ) {
        throw new Error('This signup code has reached its usage limit');
      }

      if (
        codeEntry.expires_at !== null &&
        new Date(codeEntry.expires_at) < new Date()
      ) {
        throw new Error('This signup code has expired');
      }
    } else if (data.inviteToken) {
      const { data: invite, error } = await adminClient
        .from('invitations')
        .select('*')
        .eq('invite_token', data.inviteToken)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!invite || error) {
        throw new Error('Invalid or expired invitation');
      }
    } else {
      throw new Error('Code or invite token required');
    }

    const { data: createData, error: createError } =
      await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

    if (createError) {
      throw new Error(createError.message);
    }

    if (data.code) {
      const { data: codeEntry, error: codeError } = await adminClient
        .from('signup_codes')
        .select('id, whitelabel_host_account_id')
        .eq('code', data.code)
        .maybeSingle();

      if (!codeEntry || codeError) {
        throw new Error('Failed to fetch signup code for usage tracking');
      }

      await adminClient.from('signup_code_usages').insert({
        signup_code_id: codeEntry.id,
        account_id: createData.user.id,
        whitelabel_host_account_id: codeEntry.whitelabel_host_account_id,
      });

      await adminClient
        .from('accounts')
        .update({
          whitelabel_host_account_id: codeEntry.whitelabel_host_account_id,
        })
        .eq('id', createData.user.id);
    }

    const signInData = await client.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInData.error) {
      throw new Error(signInData.error.message);
    }
    if (data.inviteToken) {
      const urlParams = new URLSearchParams({
        invite_token: data.inviteToken,
      });

      const nextUrl = `${data.joinTeamPath}?${urlParams.toString()}`;

      return redirect(nextUrl);
    }

    return signInData;
  },
  {
    auth: false,
    schema: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      code: z.string().optional(),
      inviteToken: z.string().optional(),
      joinTeamPath: z.string(),
    }),
  },
);
