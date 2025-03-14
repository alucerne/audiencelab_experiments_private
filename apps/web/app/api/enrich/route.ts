import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import miscConfig from '~/config/misc.config';
import { createEnrichmentService } from '~/lib/enrichment/enrichment.service';

const storage = new Storage({
  projectId: miscConfig.googleCloud.projectId,
  credentials: {
    client_email: miscConfig.googleCloud.clientEmail,
    private_key: miscConfig.googleCloud.privateKey,
  },
});

export const POST = enhanceRouteHandler(async ({ request }) => {
  const logger = await getLogger();
  const ctx = { name: 'enrich.upload' };

  logger.info(ctx, 'Received enrichment file request.');

  const bucketName = 'v3-audiencelab-enrichment-upload';
  const bucket = storage.bucket(bucketName);

  const formData = await request.formData();
  logger.info(ctx, 'FormData received.');

  const file = formData.get('file');
  const name = formData.get('name');
  const accountId = formData.get('accountId');

  if (!file || !(file instanceof File)) {
    logger.error(ctx, 'No file provided or file is invalid.');
    return NextResponse.json(
      { error: 'No file provided or invalid file' },
      { status: 400 },
    );
  } else if (
    !name ||
    typeof name !== 'string' ||
    !accountId ||
    typeof accountId !== 'string'
  ) {
    logger.error(ctx, 'Name or accountId not provided or invalid.');
    return NextResponse.json(
      { error: 'Name or accountId not provided' },
      { status: 400 },
    );
  }
  logger.info(
    ctx,
    `File: ${file.name}, Name: ${name}, AccountId: ${accountId}`,
  );

  const columnMappingRaw = formData.get('columnMapping');
  logger.info(ctx, `Raw columnMapping: ${columnMappingRaw}`);
  const columnMapping = JSON.parse(
    columnMappingRaw?.toString() || '{}',
  ) as Record<string, string[]>;
  logger.info(ctx, 'Parsed columnMapping:', columnMapping);
  const mappedColumns = Object.entries(columnMapping)
    .filter(
      ([field, headers]) => field !== 'DO_NOT_IMPORT' && headers.length > 0,
    )
    .map(([field]) => field);
  logger.info(ctx, `Mapped columns: ${mappedColumns.join(', ')}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uniqueFilename = `${timestamp}-${file.name}`;
  logger.info(ctx, `Unique filename generated: ${uniqueFilename}`);

  const blob = bucket.file(uniqueFilename);
  logger.info(
    ctx,
    `Uploading file to bucket ${bucketName} as ${uniqueFilename}`,
  );
  const blobStream = blob.createWriteStream({
    resumable: true,
    contentType: file.type,
    metadata: {
      columnMapping: JSON.stringify(columnMapping),
      originalName: file.name,
    },
  });

  const fileArrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(fileArrayBuffer);
  const fileStream = Readable.from(fileBuffer);

  await new Promise<void>((resolve, reject) => {
    fileStream
      .pipe(blobStream)
      .on('error', (err) => {
        logger.error(ctx, `Error uploading file: ${err}`);
        reject(`Error uploading file: ${err}`);
      })
      .on('finish', () => {
        logger.info(ctx, 'File upload completed successfully.');
        resolve();
      });
  });

  const client = getSupabaseServerClient();
  logger.info(ctx, 'Creating enrichment service job.');
  const service = createEnrichmentService(client);
  const job = await service.createEnrichment({ accountId, name });
  logger.info(ctx, `Enrichment job created with ID: ${job.id}`);
  revalidatePath('/home/[account]/enrichment', 'page');

  const gcsPath = `gs://${bucketName}/${uniqueFilename}`;
  logger.info(
    ctx,
    `Calling enqueue api: ${JSON.stringify({
      gcsPath,
      columns: mappedColumns,
      jobId: job.id,
    })}`,
  );
  const response = await fetch(`${miscConfig.audienceApiUrl}/enrich/enqueue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gcsPath,
      columns: mappedColumns,
      jobId: job.id,
    }),
  });
  logger.info(ctx, `External API responded with status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      ctx,
      `Failed to enqueue enrichment job. Response: ${errorText}`,
    );
    return NextResponse.json(
      { error: 'Failed to enqueue enrichment job' },
      { status: response.status },
    );
  }

  logger.info(ctx, 'Enrichment job enqueued successfully.');
  return NextResponse.json({ success: true });
});
