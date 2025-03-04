import { z } from 'zod';

import { getServerMonitoringService } from '@kit/monitoring/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAudienceService } from '~/lib/audience/audience.service';

export const POST = enhanceRouteHandler(
  async ({ body }) => {
    try {
      const client = getSupabaseServerAdminClient();
      const service = createAudienceService(client);

      service.updateJob(body);

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
      job_id: z.string(),
      status: z.string(),
      url: z.string().optional(),
      current: z.number().optional(),
      total: z.number().optional(),
    }),
  },
);
