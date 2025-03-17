import { z } from 'zod';

import { getDatabaseWebhookVerifier } from '@kit/database-webhooks';
import { getServerMonitoringService } from '@kit/monitoring/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAudienceService } from '~/lib/audience/audience.service';
import { audienceFiltersFormSchema } from '~/lib/audience/schema/audience-filters-form.schema';

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
      const service = createAudienceService(client);

      const audience = await service.getAudienceById(body.audienceId);

      const parsedFilters = audienceFiltersFormSchema.parse(audience.filters);

      await service.generateAudience({
        accountId: body.accountId,
        audienceId: body.audienceId,
        filters: parsedFilters,
      });

      if (!audience.refresh_interval) {
        throw Error('No interval present');
      }

      await service.updateNextScheduledRefresh({
        audienceId: body.audienceId,
        interval: audience.refresh_interval,
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
      accountId: z.string(),
      audienceId: z.string(),
    }),
  },
);
