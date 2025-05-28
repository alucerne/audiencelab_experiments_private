import { getDatabaseWebhookVerifier } from '@kit/database-webhooks';
import { getServerMonitoringService } from '@kit/monitoring/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { createNotificationsApi } from '@kit/notifications/api';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAudienceService } from '~/lib/audience/audience.service';

export const POST = enhanceRouteHandler(
  async ({ request }) => {
    try {
      const signature = request.headers.get('X-Supabase-Event-Signature');

      if (!signature) {
        return new Response('Missing signature', { status: 400 });
      }

      const verifier = await getDatabaseWebhookVerifier();

      await verifier.verifySignatureOrThrow(signature);

      const client = getSupabaseServerAdminClient();
      const service = createAudienceService(client);

      const availableInterests = await service.updateAvailableInterests();

      const api = createNotificationsApi(client);

      await Promise.all(
        availableInterests.map((interest) =>
          interest.status === 'ready'
            ? api.createNotification({
                account_id: interest.account_id,
                body: `Your custom audience is now ready: ${interest.topic || interest.description.slice(0, 50) + '...'}`,
                channel: 'in_app',
                type: 'info',
              })
            : api.createNotification({
                account_id: interest.account_id,
                body: `Your custom audience was rejected: ${interest.topic || interest.description.slice(0, 50) + '...'}`,
                channel: 'in_app',
                type: 'error',
              }),
        ),
      );

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
  },
);
