'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getLogger } from '@kit/shared/logger';

import { createSegmentService, CreateSegmentParams } from './segment.service';

// Schema for creating a segment
const CreateSegmentSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  name: z.string().min(1, 'Segment name is required'),
  description: z.string().optional(),
  sourceType: z.enum(['audience', 'webhook_upload', 'csv_upload']),
  sourceId: z.string().min(1, 'Source ID is required'),
  filters: z.array(z.any()).default([]),
  enrichmentFields: z.array(z.string()).default([]),
  customColumns: z.array(z.any()).default([]),
  tags: z.array(z.string()).default([]),
});

// Schema for updating a segment
const UpdateSegmentSchema = z.object({
  segmentId: z.string().min(1, 'Segment ID is required'),
  name: z.string().min(1, 'Segment name is required').optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]).optional(),
});

// Schema for deleting a segment
const DeleteSegmentSchema = z.object({
  segmentId: z.string().min(1, 'Segment ID is required'),
});

export const createSegmentAction = enhanceAction(
  async function(data, user) {
    const logger = await getLogger();
    const client = getSupabaseServerClient();
    const segmentService = createSegmentService(client);

    const ctx = {
      name: 'create-segment',
      userId: user.id,
      segmentName: data.name,
      sourceType: data.sourceType,
    };

    logger.info(ctx, 'Creating segment');

    try {
      // Use the account ID passed from the client
      const accountId = data.accountId;

      console.log('Server action received data:', {
        accountId: data.accountId,
        name: data.name,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        userId: user.id,
        filtersCount: data.filters.length,
        enrichmentFieldsCount: data.enrichmentFields.length,
        customColumnsCount: data.customColumns.length,
        tagsCount: data.tags.length,
      });

      const segmentParams: CreateSegmentParams = {
        accountId,
        name: data.name,
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        filters: data.filters,
        enrichmentFields: data.enrichmentFields,
        customColumns: data.customColumns,
        tags: data.tags,
        createdBy: user.id, // Add the user ID for created_by field
      };

      const segment = await segmentService.createSegment(segmentParams);

      logger.info({ ...ctx, segmentId: segment.id }, 'Segment created successfully');

      // Revalidate relevant paths
      revalidatePath('/home/[account]', 'page');
      revalidatePath('/home/[account]/studio', 'page');

      return {
        success: true,
        segmentId: segment.id,
        segment,
      };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Failed to create segment');
      
      // Return a more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to create segment: ${error.message}`);
      } else {
        throw new Error('Failed to create segment: Unknown error');
      }
    }
  },
  {
    auth: true,
    schema: CreateSegmentSchema,
  }
);

export const updateSegmentAction = enhanceAction(
  async function(data, user) {
    const logger = await getLogger();
    const client = getSupabaseServerClient();
    const segmentService = createSegmentService(client);

    const ctx = {
      name: 'update-segment',
      userId: user.id,
      segmentId: data.segmentId,
    };

    logger.info(ctx, 'Updating segment');

    try {
      const segment = await segmentService.updateSegment({
        segmentId: data.segmentId,
        name: data.name,
        description: data.description,
        tags: data.tags,
      });

      logger.info({ ...ctx, segmentId: segment.id }, 'Segment updated successfully');

      // Revalidate relevant paths
      revalidatePath('/home/[account]', 'page');
      revalidatePath('/home/[account]/studio', 'page');

      return {
        success: true,
        segment,
      };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Failed to update segment');
      throw error;
    }
  },
  {
    auth: true,
    schema: UpdateSegmentSchema,
  }
);

export const deleteSegmentAction = enhanceAction(
  async function(data, user) {
    const logger = await getLogger();
    const client = getSupabaseServerClient();
    const segmentService = createSegmentService(client);

    const ctx = {
      name: 'delete-segment',
      userId: user.id,
      segmentId: data.segmentId,
    };

    logger.info(ctx, 'Deleting segment');

    try {
      await segmentService.deleteSegment({
        segmentId: data.segmentId,
      });

      logger.info({ ...ctx }, 'Segment deleted successfully');

      // Revalidate relevant paths
      revalidatePath('/home/[account]', 'page');
      revalidatePath('/home/[account]/studio', 'page');

      return {
        success: true,
      };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Failed to delete segment');
      throw error;
    }
  },
  {
    auth: true,
    schema: DeleteSegmentSchema,
  }
);

export const generateSegmentNameAction = enhanceAction(
  async function(data, user) {
    const logger = await getLogger();
    const client = getSupabaseServerClient();
    const segmentService = createSegmentService(client);

    const ctx = {
      name: 'generate-segment-name',
      userId: user.id,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
    };

    logger.info(ctx, 'Generating segment name');

    try {
      const name = await segmentService.generateSegmentName({
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        baseName: data.baseName,
      });

      logger.info({ ...ctx, generatedName: name }, 'Segment name generated');

      return {
        success: true,
        name,
      };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Failed to generate segment name');
      
      // Return a more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to generate segment name: ${error.message}`);
      } else {
        throw new Error('Failed to generate segment name: Unknown error');
      }
    }
  },
  {
    auth: true,
    schema: z.object({
      sourceType: z.enum(['audience', 'webhook_upload', 'csv_upload', 'batch_upload']),
      sourceId: z.string(),
      baseName: z.string().optional(),
    }),
  }
); 