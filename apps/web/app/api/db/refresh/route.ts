import { z } from 'zod';

import { getDatabaseWebhookVerifier } from '@kit/database-webhooks';
import { getServerMonitoringService } from '@kit/monitoring/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAudienceService } from '~/lib/audience/audience.service';
import { audienceFiltersFormSchema } from '~/lib/audience/schema/audience-filters-form.schema';
import { createCreditsService } from '~/lib/credits/credits.service';

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
      const credits = createCreditsService(client);

      const [audience, limits] = await Promise.all([
        service.getAudienceById(body.audience_id),
        credits.getAudienceLimits({ accountId: body.account_id }),
      ]);

      const parsedFilters = audienceFiltersFormSchema.parse(audience.filters);

      await service.generateAudience({
        accountId: body.account_id,
        audienceId: body.audience_id,
        filters: parsedFilters,
        limit: limits.audienceSizeLimit,
      });

      if (!audience.refresh_interval) {
        throw Error('No interval present');
      }

      await service.updateNextScheduledRefresh({
        audienceId: body.audience_id,
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
      account_id: z.string(),
      audience_id: z.string(),
    }),
  },
);
