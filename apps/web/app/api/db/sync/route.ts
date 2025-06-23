import { z } from 'zod';

import { getDatabaseWebhookVerifier } from '@kit/database-webhooks';
import { getServerMonitoringService } from '@kit/monitoring/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAudienceSyncService } from '~/lib/integration-app/audience-sync.service';

export const POST = enhanceRouteHandler(
  async ({ request, body }) => {
    try {
      const signature = request.headers.get('X-Supabase-Event-Signature');

      if (!signature) {
        return new Response('Missing signature', { status: 400 });
      }

      const verifier = await getDatabaseWebhookVerifier();

      await verifier.verifySignatureOrThrow(signature);

      const client = getSupabaseServerAdminClient();
      const service = createAudienceSyncService(client);

      await service.startSync({
        accountId: body.account_id,
        syncId: body.audience_sync_id,
        csvUrl: body.csv_url,
      });

      return new Response(null, { status: 200 });
    } catch (error) {
      const service = await getServerMonitoringService();

      await service.ready();
      await service.captureException(error as Error);

      return new Response(null, { status: 500 });
    }
  },
  {
    auth: false,
    schema: z.object({
      account_id: z.string(),
      audience_sync_id: z.string(),
      csv_url: z.string(),
    }),
  },
);
