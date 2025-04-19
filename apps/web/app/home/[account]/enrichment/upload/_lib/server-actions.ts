'use server';

import { revalidatePath } from 'next/cache';

import { Storage } from '@google-cloud/storage';
import { getUnixTime } from 'date-fns';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import miscConfig from '~/config/misc.config';
import { createCreditsService } from '~/lib/credits/credits.service';
import { createEnrichmentService } from '~/lib/enrichment/enrichment.service';

const storage = new Storage({
  projectId: miscConfig.googleCloud.projectId,
  credentials: {
    client_email: miscConfig.googleCloud.clientEmail,
    private_key: miscConfig.googleCloud.privateKey,
  },
});

export const getUploadUrlAction = enhanceAction(
  async ({ fileName, fileType, accountId, name }) => {
    const client = getSupabaseServerClient();
    const credits = createCreditsService(client);

    const { enabled } = await credits.canCreateEnrichment({
      accountId,
    });

    if (!enabled) {
      throw new Error('Enrichment limit exceeded');
    }

    const service = createEnrichmentService(client);

    const job = await service.createEnrichment({ accountId, name });

    const bucket = storage.bucket(miscConfig.googleCloud.enrichmentBucket);

    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['PUT', 'POST', 'GET', 'HEAD', 'DELETE', 'OPTIONS'],
        origin: ['*'], //!restrict to prod url
        responseHeader: [
          'Content-Type',
          'Access-Control-Allow-Origin',
          'Origin',
          'X-Requested-With',
        ],
      },
    ]);

    const uniqueFileName = `csv/${accountId}/${getUnixTime(new Date())}_${job.id}.csv`;
    const file = bucket.file(uniqueFileName);

    const expires = Date.now() + 15 * 60 * 1000;

    const signedUrlResponse = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires,
      contentType: fileType,
      queryParams: {
        'response-content-disposition': `attachment; filename="${fileName}"`,
      },
    });

    const signedUrl = signedUrlResponse[0];

    return {
      signedUrl,
      uniqueFileName,
      jobId: job.id,
    };
  },
  {
    schema: z.object({
      fileName: z.string(),
      fileType: z.string(),
      accountId: z.string(),
      name: z.string(),
    }),
  },
);

export const processEnrichmentAction = enhanceAction(
  async ({
    accountId,
    jobId,
    columnMapping,
    uniqueFileName,
    originalFileName,
    operator,
  }) => {
    const bucket = storage.bucket(miscConfig.googleCloud.enrichmentBucket);
    const file = bucket.file(uniqueFileName);

    await file.setMetadata({
      metadata: {
        columnMapping: JSON.stringify(columnMapping),
        originalName: originalFileName,
      },
    });

    const mappedColumns = Object.entries(columnMapping)
      .filter(
        ([field, headers]) => field !== 'DO_NOT_IMPORT' && headers.length > 0,
      )
      .map(([field]) => field);

    const response = await fetch(
      `${miscConfig.enrichmentApiUrl}/enrich/enqueue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcsPath: `gs://${miscConfig.googleCloud.enrichmentBucket}/${uniqueFileName}`,
          columns: mappedColumns,
          jobId: jobId,
          accountId,
          operator,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to enqueue enrichment job');
    }

    revalidatePath('/home/[account]/enrichment', 'page');

    return;
  },
  {
    schema: z.object({
      uniqueFileName: z.string(),
      accountId: z.string(),
      jobId: z.string(),
      columnMapping: z.record(z.array(z.string())),
      originalFileName: z.string(),
      operator: z.enum(['OR', 'AND']),
    }),
  },
);
