import { cache } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export const loadWhiteLabel = cache(whiteLabelLoader);

async function whiteLabelLoader(id: string) {
  const client = getSupabaseServerAdminClient();

  const { data: hostCredits, error: hostError } = await client
    .from('whitelabel_credits')
    .select('account_id')
    .eq('account_id', id)
    .maybeSingle();

  if (hostError) throw hostError;

  if (hostCredits) {
    return 'host';
  }

  const { data: subAccount, error: subError } = await client
    .from('accounts')
    .select('whitelabel_host_account_id')
    .eq('id', id)
    .maybeSingle();

  if (subError) throw subError;

  if (subAccount?.whitelabel_host_account_id) {
    const { data: hostAccount, error: hostInfoError } = await client
      .from('accounts')
      .select('id, name')
      .eq('id', subAccount.whitelabel_host_account_id)
      .maybeSingle();

    if (hostInfoError) throw hostInfoError;

    if (hostAccount) {
      return {
        status: 'subaccount' as const,
        host: {
          id: hostAccount.id,
          name: hostAccount.name,
        },
      };
    }
  }

  return 'regular';
}
