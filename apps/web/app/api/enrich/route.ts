import { NextResponse } from 'next/server';

import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

import { enhanceRouteHandler } from '@kit/next/routes';
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
  const bucketName = 'v3-audiencelab-enrichment-upload';
  const bucket = storage.bucket(bucketName);

  const formData = await request.formData();
  const file = formData.get('file');
  const name = formData.get('name');
  const accountId = formData.get('accountId');

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'No file provided or invalid file' },
      { status: 400 },
    );
  } else if (
    !name ||
    !(typeof name === 'string') ||
    !accountId ||
    !(typeof accountId === 'string')
  ) {
    return NextResponse.json(
      { error: 'Name or accountId not provided' },
      { status: 400 },
    );
  }

  const columnMapping = JSON.parse(
    formData.get('columnMapping')?.toString() || '{}',
  ) as Record<string, string[]>;
  const mappedColumns = Object.entries(columnMapping)
    .filter(
      ([field, headers]) => field !== 'DO_NOT_IMPORT' && headers.length > 0,
    )
    .map(([field]) => field);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uniqueFilename = `${timestamp}-${file.name}`;

  const blobStream = bucket.file(uniqueFilename).createWriteStream({
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

  await new Promise((resolve, reject) => {
    fileStream
      .pipe(blobStream)
      .on('error', (err) => {
        reject(`Error uploading file: ${err}`);
      })
      .on('finish', () => {
        resolve(null);
      });
  });

  const client = getSupabaseServerClient();
  const service = createEnrichmentService(client);

  const job = await service.createEnrichment({
    accountId,
    name,
  });

  const response = await fetch(`${miscConfig.audienceApiUrl}/enrich/enqueue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gcsPath: `gs://${bucketName}/${uniqueFilename}`,
      columns: mappedColumns,
      jobId: job.id,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error: 'Failed to enqueue enrichment job',
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    success: true,
  });
});
