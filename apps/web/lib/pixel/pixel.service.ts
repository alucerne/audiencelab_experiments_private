import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import miscConfig from '~/config/misc.config';
import { Database } from '~/lib/database.types';

export function createPixelService(client: SupabaseClient<Database>) {
  return new PixelService(client);
}

class PixelService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getPixels(params: { accountId: string }) {
    const { data, error } = await this.client
      .from('pixel')
      .select('*')
      .eq('account_id', params.accountId)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async getDelivrDetails({ accountId }: { accountId: string }) {
    const { data: accountData, error: accountError } = await this.client
      .from('accounts')
      .select('delivr_org_id, delivr_project_id, name')
      .eq('id', accountId)
      .single();

    if (accountError) {
      throw accountError;
    }

    if (accountData.delivr_org_id && accountData.delivr_project_id) {
      return {
        delivrOrgId: accountData.delivr_org_id,
        delivrProjectId: accountData.delivr_project_id,
      };
    }

    const response = await fetch(
      `${miscConfig.delivrPixel.apiUrl}/public/core/api/organization/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${miscConfig.delivrPixel.jwt}`,
          'X-Delivr-Client-ID': miscConfig.delivrPixel.appClientId,
          'X-Delivr-Client-Secret': miscConfig.delivrPixel.appClientSecret,
          enterprise_id: miscConfig.delivrPixel.enterpriseId,
        },
        body: JSON.stringify({
          name: accountData.name,
        }),
      },
    );

    const {
      response: { organization },
    } = z
      .object({
        response: z.object({
          organization: z.object({
            organization_id: z.string().uuid(),
            project_id: z.string().uuid(),
          }),
        }),
      })
      .parse(await response.json());

    const { error: updateError } = await this.client
      .from('accounts')
      .update({
        delivr_org_id: organization.organization_id,
        delivr_project_id: organization.project_id,
      })
      .eq('id', accountId);

    if (updateError) {
      throw updateError;
    }

    return {
      delivrOrgId: organization.organization_id,
      delivrProjectId: organization.project_id,
    };
  }

  async createPixel({
    accountId,
    websiteName,
    websiteUrl,
    webhookUrl,
  }: {
    accountId: string;
    websiteName: string;
    websiteUrl: string;
    webhookUrl?: string;
  }) {
    const { delivrOrgId, delivrProjectId } = await this.getDelivrDetails({
      accountId,
    });

    const response = await fetch(
      `${miscConfig.delivrPixel.apiUrl}/public/core/api/pixel/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${miscConfig.delivrPixel.jwt}`,
          'X-Delivr-Client-ID': miscConfig.delivrPixel.appClientId,
          'X-Delivr-Client-Secret': miscConfig.delivrPixel.appClientSecret,
          enterprise_id: miscConfig.delivrPixel.enterpriseId,
          organization_id: delivrOrgId,
          project_id: delivrProjectId,
        },
        body: JSON.stringify({
          title: websiteName,
        }),
      },
    );

    const { response: newPixel } = z
      .object({
        response: z.object({
          pixel_id: z.string().uuid(),
          installation_url: z.string(),
        }),
      })
      .parse(await response.json());

    const { data, error } = await this.client
      .from('pixel')
      .insert({
        account_id: accountId,
        website_name: websiteName,
        website_url: websiteUrl,
        webhook_url: webhookUrl,
        delivr_id: newPixel.pixel_id,
        delivr_install_url: newPixel.installation_url,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
