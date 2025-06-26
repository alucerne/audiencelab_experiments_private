import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@kit/supabase/database';

export function createAdminWhiteLabelService(client: SupabaseClient<Database>) {
  return new AdminWhiteLabelService(client);
}

class AdminWhiteLabelService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getWhiteLabelBranding(accountId: string) {
    const { data, error } = await this.client
      .from('whitelabel_branding')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const { data: inserted, error: insertError } = await this.client
        .from('whitelabel_branding')
        .insert({ account_id: accountId })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return inserted;
    }

    return data;
  }

  async verifyWhiteLabelBranding(accountId: string) {
    const { data, error } = await this.client
      .from('whitelabel_branding')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        verified: false as const,
        missing: [
          'company_name',
          'logo_url',
          'icon_url',
          'domain',
          'domain_verified',
        ],
      };
    }

    const requiredFields: (keyof typeof data)[] = [
      'company_name',
      'logo_url',
      'icon_url',
      'domain',
    ];

    const missing = requiredFields.filter((field) => !data[field]);

    if (!data.domain_verified) {
      missing.push('domain_verified');
    }

    if (missing.length === 0) {
      return { verified: true as const };
    }

    return {
      verified: false as const,
      missing,
    };
  }

  async updateCompanyName({
    accountId,
    name,
  }: {
    accountId: string;
    name: string;
  }) {
    const { error } = await this.client
      .from('whitelabel_branding')
      .update({ company_name: name })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }
  }

  async updateLogo({
    accountId,
    logoUrl,
  }: {
    accountId: string;
    logoUrl: string;
  }) {
    const { error } = await this.client
      .from('whitelabel_branding')
      .update({ logo_url: logoUrl })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }
  }

  async updateIcon({
    accountId,
    iconUrl,
  }: {
    accountId: string;
    iconUrl: string;
  }) {
    const { error } = await this.client
      .from('whitelabel_branding')
      .update({ icon_url: iconUrl })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }
  }

  async updateDomain({
    accountId,
    domain,
  }: {
    accountId: string;
    domain: string;
  }) {
    const response = await fetch(
      'https://api.vercel.com/v9/projects/prj_tknJjbjlQwDgSyq7ZMy9JPt6nDnV/domains?teamId=team_XERV41K7eo3NFYpTBXTexcZE',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer kXwgeHc3gXmmqDKy8pggeDWU`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: domain,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to add domain to Vercel`);
    }

    const { error } = await this.client
      .from('whitelabel_branding')
      .update({ domain })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }
  }

  async verifyDomain({
    accountId,
    domain,
  }: {
    accountId: string;
    domain: string;
  }) {
    const response = await fetch(
      `https://api.vercel.com/v6/domains/${domain}/config?teamId=team_XERV41K7eo3NFYpTBXTexcZE`,
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer kXwgeHc3gXmmqDKy8pggeDWU',
          'Content-Type': 'application/json',
        },
      },
    );

    const verification = z
      .object({
        misconfigured: z.boolean(),
        recommendedIPv4: z.array(
          z.object({
            rank: z.number(),
            value: z.array(z.string()),
          }),
        ),
        recommendedCNAME: z.array(
          z.object({
            rank: z.number(),
            value: z.string(),
          }),
        ),
      })
      .parse(await response.json());

    if (verification.misconfigured) {
      return {
        verified: false as const,
        records:
          domain.split('.').length > 2
            ? {
                type: 'CNAME',
                name: domain.split('.').slice(0, -2).join('.'),
                value: verification.recommendedCNAME[0]!.value,
              }
            : {
                type: 'A',
                name: domain,
                value: verification.recommendedIPv4[0]!.value[0],
              },
      };
    }

    const { error } = await this.client
      .from('whitelabel_branding')
      .update({ domain_verified: true })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }

    return {
      verified: true as const,
    };
  }
}
