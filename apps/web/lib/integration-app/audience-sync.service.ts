import { SupabaseClient } from '@supabase/supabase-js';

import { Json } from '@kit/supabase/database';

import miscConfig from '~/config/misc.config';
import { Database } from '~/lib/database.types';

import { NewSyncFormSchema } from './schema/new-sync-form.schema';
import { generateIntegrationToken } from './utils';

export function createAudienceSyncService(client: SupabaseClient<Database>) {
  return new AudienceSyncService(client);
}

export type AudienceSyncList = Awaited<
  ReturnType<AudienceSyncService['getAudienceSyncs']>
>;

class AudienceSyncService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAudienceSyncs(params: { accountId: string }) {
    const { data, error } = await this.client
      .from('audience_sync')
      .select('*, audience(name, next_scheduled_refresh)')
      .eq('account_id', params.accountId);

    if (error) {
      throw error;
    }

    return data;
  }

  async createAudienceSync({
    accountId,
    audienceId,
    integrationKey,
    integrationDetails,
  }: {
    accountId: string;
    audienceId: string;
    integrationKey: string;
    integrationDetails: Json;
  }) {
    const { data, error } = await this.client
      .from('audience_sync')
      .insert({
        account_id: accountId,
        audience_id: audienceId,
        integration_key: integrationKey,
        integration_details: integrationDetails,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteSync({ syncId }: { syncId: string }) {
    const { error } = await this.client
      .from('audience_sync')
      .delete()
      .eq('id', syncId);

    if (error) {
      throw error;
    }
  }

  async getAudienceSyncById(params: { id: string }) {
    const { data, error } = await this.client
      .from('audience_sync')
      .select('*, audience(name, next_scheduled_refresh)')
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async startSync({
    accountId,
    syncId,
    csvUrl,
  }: {
    accountId: string;
    syncId: string;
    csvUrl: string;
  }) {
    const { data, error } = await this.client
      .from('audience_sync')
      .select()
      .eq('id', syncId)
      .single();

    if (error) {
      throw error;
    }

    const integrationDetails = NewSyncFormSchema.shape.integration.parse(
      data.integration_details,
    );

    let endpoint: string;
    const basePayload = {
      audience_sync_id: syncId,
      csv_url: csvUrl,
      integration_jwt: generateIntegrationToken({
        customerId: accountId,
        customerName: accountId,
      }),
    };

    switch (integrationDetails.integrationKey) {
      case 'facebook-ads':
        endpoint = '/facebook/enqueue';
        Object.assign(basePayload, {
          fb_audience_id: integrationDetails.fbAudienceId,
        });
        break;
      //! add other integrations and needed details for enqueue api here
      // case 'google-ads':
      //   endpoint = '/google/enqueue';
      //   Object.assign(basePayload, {
      //     google_audience_id: integrationDetails.googleAudienceId,
      //   });
      //   break;

      default:
        throw new Error(`Unsupported integration: ${data.integration_key}`);
    }

    const response = await fetch(`${miscConfig.syncApiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to start sync: ${response.status}`);
    }

    const { error: syncError } = await this.client
      .from('audience_sync')
      .update({
        sync_status: 'IN_QUEUE',
      })
      .eq('id', syncId);

    if (syncError) {
      throw syncError;
    }
  }
}
