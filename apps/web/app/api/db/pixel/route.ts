import { z } from 'zod';

import { getDatabaseWebhookVerifier } from '@kit/database-webhooks';
import { getServerMonitoringService } from '@kit/monitoring/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export const POST = enhanceRouteHandler(
  async ({ request }) => {
    const logger = await getLogger();
    const ctx = {
      name: 'pixel.webhook',
    };

    try {
      const signature = request.headers.get('X-Supabase-Event-Signature');

      if (!signature) {
        return new Response('Missing signature', { status: 400 });
      }

      const verifier = await getDatabaseWebhookVerifier();

      await verifier.verifySignatureOrThrow(signature);

      const client = getSupabaseServerAdminClient();

      const { data: pixels, error: fetchError } = await client
        .from('pixel')
        .select('id, delivr_id, webhook_url, last_webhook_event_time')
        .neq('webhook_url', null);

      if (fetchError) throw fetchError;

      logger.info(
        ctx,
        `Found ${pixels.length} pixels with webhook URLs to process.`,
      );

      const tasks = pixels.map((pixel) =>
        (async () => {
          try {
            const start_time = pixel.last_webhook_event_time
              ? new Date(pixel.last_webhook_event_time)
                  .toISOString()
                  .replace('T', ' ')
                  .split('.')[0]
              : undefined;

            const resp = await fetch(
              'https://v3-pixel-job-72802495918.us-east1.run.app/webhook',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  start_time,
                  pixel_id: pixel.delivr_id,
                  webhook_url: pixel.webhook_url,
                }),
              },
            );

            if (!resp.ok) {
              logger.error(
                ctx,
                `Failed to fetch webhook for pixel ${pixel.id}: ${resp.status} ${resp.statusText}`,
              );

              return;
            }

            const body = z
              .union([
                z.object({
                  latest_timestamp: z.string().datetime(),
                }),
                z.object({
                  message: z.string(),
                }),
              ])
              .parse(await resp.json());

            if ('message' in body) {
              logger.error(
                ctx,
                `Webhook response for pixel ${pixel.id} contains error: ${body.message}`,
              );
              return;
            }

            if (body.latest_timestamp === '0001-01-01T00:00:00Z') {
              logger.info(
                ctx,
                `No new events for pixel ${pixel.id}, skipping update.`,
              );
              return;
            }

            const { error: updateError } = await client
              .from('pixel')
              .update({
                last_webhook_event_time: body.latest_timestamp,
                last_sync: new Date().toISOString(),
              })
              .eq('id', pixel.id);

            if (updateError) {
              logger.error(
                ctx,
                `Failed to update pixel ${pixel.id} after webhook: ${updateError.message}`,
              );
            }
          } catch (err) {
            logger.error(
              ctx,
              `Error processing pixel ${pixel.id}: ${(err as Error).message}`,
            );
          }
        })(),
      );

      await Promise.allSettled(tasks);

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
