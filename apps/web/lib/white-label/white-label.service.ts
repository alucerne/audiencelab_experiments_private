import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '~/lib/database.types';

import { CreditsFormSchema } from './schema/credits-form.schema';
import { SignupLinkFormSchema } from './schema/signup-link-form.schema';

export function createWhiteLabelService(client: SupabaseClient<Database>) {
  return new WhiteLabelService(client);
}

export type SignupLinkData = Awaited<
  ReturnType<WhiteLabelService['getSignupLinks']>
>[number];

class WhiteLabelService {
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
          gitBranch:
            process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'staging'
              ? 'staging'
              : undefined,
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

  async removeDomain({
    accountId,
    domain,
  }: {
    accountId: string;
    domain: string;
  }) {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/prj_tknJjbjlQwDgSyq7ZMy9JPt6nDnV/domains/${domain}?teamId=team_XERV41K7eo3NFYpTBXTexcZE`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer kXwgeHc3gXmmqDKy8pggeDWU`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to remove domain from Vercel`);
    }

    const { error } = await this.client
      .from('whitelabel_branding')
      .update({ domain: null, domain_verified: false })
      .eq('account_id', accountId);

    if (error) {
      throw error;
    }
  }

  async getSignupLinks(accountId: string) {
    const { data, error } = await this.client
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
      .eq('whitelabel_host_account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async createSignupLink({
    accountId,
    signup,
    permissions,
  }: z.infer<typeof SignupLinkFormSchema> & { accountId: string }) {
    const { data: hostCredits, error: creditError } = await this.client
      .from('whitelabel_credits')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (creditError || !hostCredits) {
      throw creditError || new Error('Host credits not found');
    }

    const numericFields = [
      'monthly_audience_limit',
      'max_custom_interests',
      'audience_size_limit',
      'monthly_pixel_limit',
      'pixel_size_limit',
      'monthly_enrichment_limit',
      'enrichment_size_limit',
    ] as const;

    const exceededFields = numericFields.filter(
      (field) => permissions[field] > hostCredits[field],
    );

    if (exceededFields.length > 0) {
      throw new Error(
        `Signup permissions exceed host credits for: ${exceededFields.join(', ')}`,
      );
    }

    if (permissions.b2b_access && !hostCredits.b2b_access) {
      throw new Error('Host does not allow B2B access.');
    }

    if (permissions.intent_access && !hostCredits.intent_access) {
      throw new Error('Host does not allow intent access.');
    }

    const { data, error } = await this.client
      .from('signup_codes')
      .insert({
        whitelabel_host_account_id: accountId,
        name: signup.name,
        code: signup.code,
        max_usage: signup.max_usage,
        expires_at: signup.expires_at?.toISOString(),
        permissions,
      })
      .select()
      .single();

    if (error) {
      throw error;
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
      throw error;
    }
  }

  async updatePermissions({ id, ...data }: z.infer<typeof CreditsFormSchema>) {
    const { error } = await this.client
      .from('signup_codes')
      .update({
        permissions: data,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async getTeams(whiteLabelId: string) {
    const { data, error } = await this.client
      .from('accounts')
      .select('*')
      .eq('whitelabel_host_account_id', whiteLabelId)
      .eq('is_personal_account', false);

    if (error) {
      throw error;
    }

    return data;
  }

  async getLogosByDomain(domain: string) {
    const { data, error } = await this.client
      .from('whitelabel_branding')
      .select('logo_url, icon_url')
      .eq('domain', domain)
      .eq('domain_verified', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async getWhiteLabelCredits({ accountId }: { accountId: string }) {
    const [{ data: limits }, { data: usage }] = await Promise.all([
      this.client
        .from('whitelabel_credits')
        .select('*')
        .eq('account_id', accountId)
        .single(),

      this.client
        .from('whitelabel_credits_usage')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle(),
    ]);

    if (!limits)
      throw new Error('Missing credit limits for this whitelabel account');

    return {
      enrichment: {
        monthlyMax: limits.monthly_enrichment_limit,
        allocated: usage?.allocated_monthly_enrichment_limit ?? 0,
        currentCount: usage?.current_enrichment ?? 0,
        sizeLimit: limits.enrichment_size_limit,
        allocatedSize: usage?.allocated_enrichment_size_limit ?? 0,
      },
      audience: {
        maxLists: limits.monthly_audience_limit,
        allocated: usage?.allocated_monthly_audience_limit ?? 0,
        currentCount: usage?.current_audience ?? 0,
        sizeLimit: limits.audience_size_limit,
        allocatedSize: usage?.allocated_audience_size_limit ?? 0,
      },
      audienceFilters: {
        maxCustomInterests: limits.max_custom_interests,
        allocated: usage?.allocated_max_custom_interests ?? 0,
        currentCustom: usage?.current_custom ?? 0,
        b2bAccess: limits.b2b_access,
        intentAccess: limits.intent_access,
      },
      pixel: {
        maxPixels: limits.monthly_pixel_limit,
        allocated: usage?.allocated_monthly_pixel_limit ?? 0,
        currentCount: usage?.current_pixel ?? 0,
        sizeLimit: limits.pixel_size_limit,
        allocatedSize: usage?.allocated_pixel_size_limit ?? 0,
      },
      restricted: limits.restricted,
    };
  }

  async getTeamsIds(hostId: string) {
    const { data, error } = await this.client
      .from('accounts')
      .select('name, id')
      .eq('whitelabel_host_account_id', hostId)
      .eq('is_personal_account', false);

    if (error) {
      throw error;
    }

    return data;
  }
}
