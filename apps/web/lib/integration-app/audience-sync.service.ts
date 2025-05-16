import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import miscConfig from '~/config/misc.config';
import { Database } from '~/lib/database.types';

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
    integrationKey,
    fbAdAccountId,
    fbAdAccountName,
    fbAudienceId,
    fbAudienceName,
    accountId,
    audienceId,
  }: {
    integrationKey: string;
    fbAdAccountId: string;
    fbAdAccountName: string;
    fbAudienceId: string;
    fbAudienceName: string;
    accountId: string;
    audienceId: string;
  }) {
    const { data, error } = await this.client
      .from('audience_sync')
      .insert({
        account_id: accountId,
        audience_id: audienceId,
        integration_key: integrationKey,
        integration_details: {
          fb_ad_account_id: fbAdAccountId,
          fb_ad_account_name: fbAdAccountName,
          fb_audience_id: fbAudienceId,
          fb_audience_name: fbAudienceName,
        },
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

    const integrationDetails = z
      .object({
        fb_ad_account_id: z.string(),
        fb_ad_account_name: z.string(),
        fb_audience_id: z.string(),
        fb_audience_name: z.string(),
      })
      .parse(data.integration_details);

    const response = await fetch(`${miscConfig.syncApiUrl}/facebook/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audience_sync_id: syncId,
        fb_audience_id: integrationDetails.fb_audience_id,
        csv_url: csvUrl,
        integration_jwt: generateIntegrationToken({
          customerId: accountId,
          customerName: accountId,
        }),
      }),
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
