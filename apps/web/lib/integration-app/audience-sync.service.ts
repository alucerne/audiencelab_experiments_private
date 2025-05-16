import { SupabaseClient } from '@supabase/supabase-js';

import { IntegrationAppClient } from '@integration-app/sdk';
import crypto from 'crypto';
import Papa from 'papaparse';
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

  async syncFacebookAudience({
    integrationJWT,
    syncId,
    csvUrl,
  }: {
    integrationJWT: string;
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
        fb_audience_id: z.string(),
      })
      .parse(data.integration_details);

    const res = await fetch(csvUrl);

    if (!res.ok) throw new Error(`Failed to load CSV: ${res.status}`);

    const csvText = await res.text();

    const { data: rows, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length) {
      throw new Error('CSV parse failed');
    }

    const validRows = rows.filter((r) => {
      const firstName = r.FIRST_NAME?.trim();
      const lastName = r.LAST_NAME?.trim();
      const emailsRaw = r.PERSONAL_EMAILS?.trim();
      const firstEmail = emailsRaw?.split(',')[0]?.trim();

      return Boolean(firstName && lastName && firstEmail);
    });

    const integrationApp = new IntegrationAppClient({ token: integrationJWT });
    const sessionId = simpleRandomUint64();
    const BATCH_SIZE = 100;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      const audienceMembersData = batch.map((r) => {
        const firstName = r.FIRST_NAME?.trim();
        const lastName = r.LAST_NAME?.trim();
        const firstEmail = r.PERSONAL_EMAILS?.split(',')[0]?.trim();

        if (!firstName || !lastName || !firstEmail) {
          throw new Error('Invalid row data');
        }

        return [hashData(firstName), hashData(lastName), hashData(firstEmail)];
      });

      const isLastBatch = i + BATCH_SIZE >= rows.length;

      const payload = {
        audienceId: integrationDetails.fb_audience_id,
        data: audienceMembersData,
        session: {
          id: sessionId.toString(),
          batchSeq: i / BATCH_SIZE + 1,
          lastBatchFlag: isLastBatch,
        },
      };

      //!need to use create-users-in-audience if it's a custom audience

      await integrationApp
        .connection('facebook-ads')
        .action('replace-users-in-audience')
        .run(payload);
    }

    return { success: true };
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
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', syncId);

    if (syncError) {
      throw syncError;
    }
  }
}

function simpleRandomUint64() {
  return BigInt.asUintN(
    64,
    BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
  );
}

function hashData(data: string | undefined): string | undefined {
  if (!data) return undefined;
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
}
