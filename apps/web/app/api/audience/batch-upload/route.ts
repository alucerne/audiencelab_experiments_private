import { NextRequest, NextResponse } from 'next/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { z } from 'zod';
import { getLogger } from '@kit/shared/logger';

// Schema for batch upload request
const BatchUploadSchema = z.object({
  upload_name: z.string().min(1, 'Upload name is required').max(100, 'Upload name too long'),
  records: z.array(z.record(z.any())).min(1, 'At least one record is required').max(50000, 'Maximum 50,000 records per batch'),
  fields: z.array(z.string()).optional(),
});

// In-memory store for batch uploads (in production, use database)
export const batchUploadStore: Record<string, any> = {};

// Generate unique upload ID
function generateUploadId(): string {
  return `upl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique session token
function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate required fields for enrichment
function validateEnrichmentFields(records: any[]): { valid: boolean; missingFields: string[] } {
  if (records.length === 0) {
    return { valid: false, missingFields: ['No records provided'] };
  }

  const firstRecord = records[0];
  const requiredFields = ['business_email', 'personal_email', 'email', 'domain', 'company_domain'];
  const missingFields = requiredFields.filter(field => !firstRecord.hasOwnProperty(field));

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

export const POST = enhanceRouteHandler(
  async function({ body, user }) {
    const logger = await getLogger();
    const ctx = {
      name: 'batch-upload',
      userId: user.id,
      uploadName: body.upload_name,
    };

    logger.info(ctx, 'Batch upload request started');

    try {
      // Validate payload size (5MB limit)
      const payloadSize = JSON.stringify(body).length;
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (payloadSize > maxSize) {
        logger.warn(ctx, `Payload too large: ${payloadSize} bytes`);
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Payload too large. Maximum size is 5MB.' 
          },
          { status: 413 }
        );
      }

      // Validate records
      const { records } = body;
      if (!Array.isArray(records) || records.length === 0) {
        logger.warn(ctx, 'Invalid records array');
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Records must be a non-empty array' 
          },
          { status: 400 }
        );
      }

      // Check batch size limit
      const maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE || '50000');
      if (records.length > maxBatchSize) {
        logger.warn(ctx, `Batch size too large: ${records.length} records`);
        return NextResponse.json(
          { 
            status: 'error', 
            message: `Batch size too large. Maximum ${maxBatchSize} records per request.` 
          },
          { status: 400 }
        );
      }

      // Validate enrichment fields
      const enrichmentValidation = validateEnrichmentFields(records);
      if (!enrichmentValidation.valid) {
        logger.warn(ctx, `Missing enrichment fields: ${enrichmentValidation.missingFields.join(', ')}`);
        return NextResponse.json(
          { 
            status: 'error', 
            message: `Missing required fields for enrichment: ${enrichmentValidation.missingFields.join(', ')}. At least one of: business_email, personal_email, email, domain, company_domain is required.` 
          },
          { status: 400 }
        );
      }

      // Generate upload ID and session token
      const uploadId = generateUploadId();
      const sessionToken = generateSessionToken();

      // Store the batch upload data
      batchUploadStore[uploadId] = {
        upload_id: uploadId,
        session_token: sessionToken,
        upload_name: body.upload_name,
        records: records,
        fields: body.fields || Object.keys(records[0] || {}),
        user_id: user.id,
        created_at: new Date().toISOString(),
        rows_received: records.length,
        status: 'uploaded'
      };

      logger.info(ctx, `Batch upload successful: ${records.length} records`, {
        uploadId,
        sessionToken,
        recordCount: records.length
      });

      return NextResponse.json({
        status: 'success',
        upload_id: uploadId,
        session_token: sessionToken,
        rows_received: records.length,
        message: 'Batch upload successful'
      });

    } catch (error) {
      logger.error({ ...ctx, error }, 'Batch upload failed');
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Internal server error' 
        },
        { status: 500 }
      );
    }
  },
  { 
    auth: true, 
    schema: BatchUploadSchema 
  }
);

// Export function to get batch upload data (used by Studio)
export function getBatchUploadData(uploadId: string): any {
  return batchUploadStore[uploadId] || null;
}

// Export function to list user's batch uploads
export function getUserBatchUploads(userId: string): any[] {
  return Object.values(batchUploadStore).filter((upload: any) => upload.user_id === userId);
}

// GET endpoint to list user's batch uploads
export const GET = enhanceRouteHandler(
  async function({ user }) {
    const logger = await getLogger();
    const ctx = {
      name: 'batch-upload-list',
      userId: user.id,
    };

    logger.info(ctx, 'Fetching user batch uploads');

    try {
      const uploads = getUserBatchUploads(user.id);
      
      logger.info(ctx, `Found ${uploads.length} batch uploads for user`);
      
      return NextResponse.json({
        status: 'success',
        uploads: uploads.map(upload => ({
          upload_id: upload.upload_id,
          upload_name: upload.upload_name,
          created_at: upload.created_at,
          rows_received: upload.rows_received,
          status: upload.status
        }))
      });
    } catch (error) {
      logger.error({ ...ctx, error }, 'Failed to fetch batch uploads');
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to fetch batch uploads' 
        },
        { status: 500 }
      );
    }
  },
  { 
    auth: true 
  }
); 