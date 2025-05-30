import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import miscConfig from '~/config/misc.config';
import { Database } from '~/lib/database.types';

export function createPixelService(client: SupabaseClient<Database>) {
  return new PixelService(client);
}

export type ResolutionsPreview = Awaited<
  ReturnType<PixelService['getResolutionsPreview']>
>;

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

  async getPixelById(params: { id: string }) {
    const { data, error } = await this.client
      .from('pixel')
      .select('*')
      .eq('id', params.id)
      .single();

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

  async deletePixel(params: {
    id: string;
    delivrPixelId: string;
    accountId: string;
  }) {
    const { delivrOrgId, delivrProjectId } =
      await this.getDelivrDetails(params);

    const response = await fetch(
      `${miscConfig.delivrPixel.apiUrl}/public/core/api/pixel/delete`,
      {
        method: 'DELETE',
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
          pixel_id: params.delivrPixelId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to delete pixel');
    }

    const { error } = await this.client
      .from('pixel')
      .update({ deleted: true })
      .eq('id', params.id);

    if (error) {
      throw error;
    }
  }

  async getResolutionsPreview({ id }: { id: string }) {
    const { data, error } = await this.client
      .from('pixel')
      .select('id, delivr_id')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    const response = await fetch(
      `${miscConfig.pixelApiUrl}/fetch?pixel_id=${data.delivr_id}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    return z
      .object({
        num_records: z.number(),
        events: z
          .array(
            z.object({
              pixel_id: z.string(),
              event_timestamp: z.string(),
              event_type: z.string(),
              hem_sha256: z.string(),
              ip_address: z.string(),
              activity_start_date: z.string(),
              activity_end_date: z.string(),
              referrer_url: z.string(),
              event_data: z
                .record(
                  z.union([
                    z.string(),
                    z.number(),
                    z.array(z.string()),
                    z.null(),
                    z.record(z.unknown()),
                  ]),
                )
                .nullable()
                .optional(),
              resolution: z
                .record(
                  z.union([
                    z.string(),
                    z.number(),
                    z.array(z.string()),
                    z.null(),
                    z.record(z.unknown()),
                  ]),
                )
                .nullable()
                .optional(),
            }),
          )
          .nullable(),
      })
      .parse(await response.json());
  }

  async setWebhook({
    id,
    webhookUrl,
  }: {
    id: string;
    webhookUrl: string | null;
  }) {
    const { error } = await this.client
      .from('pixel')
      .update({
        webhook_url: webhookUrl,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
