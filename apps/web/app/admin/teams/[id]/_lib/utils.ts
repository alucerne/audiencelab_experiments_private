import { cache } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export const loadTeam = cache(teamLoader);

async function teamLoader(id: string) {
  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('accounts')
    .select('*, whitelabel_credits(*)')
    .eq('id', id)
    .eq('is_personal_account', false)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
