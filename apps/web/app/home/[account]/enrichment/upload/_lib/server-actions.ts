'use server';

import { revalidatePath } from 'next/cache';

import { Storage } from '@google-cloud/storage';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import miscConfig from '~/config/misc.config';
import { createCreditsService } from '~/lib/credits/credits.service';
import { createEnrichmentService } from '~/lib/enrichment/enrichment.service';

const bucketName = 'v3-audiencelab-enrichment-upload';

const storage = new Storage({
  projectId: miscConfig.googleCloud.projectId,
  credentials: {
    client_email: miscConfig.googleCloud.clientEmail,
    private_key: miscConfig.googleCloud.privateKey,
  },
});

export const getUploadUrlAction = enhanceAction(
  async ({ fileName, fileType }) => {
    const bucket = storage.bucket(bucketName);

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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFilename = `${timestamp}-${fileName}`;
    const file = bucket.file(uniqueFilename);

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
      uniqueFilename,
    };
  },
  {
    schema: z.object({
      fileName: z.string(),
      fileType: z.string(),
    }),
  },
);

export const processEnrichmentAction = enhanceAction(
  async ({
    name,
    accountId,
    columnMapping,
    uniqueFilename,
    originalFileName,
  }) => {
    const client = getSupabaseServerClient();
    const credits = createCreditsService(client);

    const { enabled } = await credits.canCreateEnrichment({
      accountId,
    });

    if (!enabled) {
      throw new Error('Enrichment limit exceeded');
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(uniqueFilename);

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

    const service = createEnrichmentService(client);
    const job = await service.createEnrichment({ accountId, name });

    const response = await fetch(
      `${miscConfig.enrichmentApiUrl}/enrich/enqueue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcsPath: `gs://${bucketName}/${uniqueFilename}`,
          columns: mappedColumns,
          jobId: job.id,
          accountId,
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
      uniqueFilename: z.string(),
      name: z.string(),
      accountId: z.string(),
      columnMapping: z.record(z.array(z.string())),
      originalFileName: z.string(),
    }),
  },
);
