import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables } from '~/lib/database.types';

export interface CreateSegmentParams {
  accountId: string;
  name: string;
  description?: string;
  sourceType: 'audience' | 'webhook_upload' | 'csv_upload' | 'batch_upload';
  sourceId: string;
  filters: any[];
  enrichmentFields: string[];
  customColumns: any[];
  tags?: string[];
  createdBy: string; // Add user ID for created_by field
}

export type Segment = Tables<'segments'>;

export function createSegmentService(client: SupabaseClient<Database>) {
  return new SegmentService(client);
}

class SegmentService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async createSegment(params: CreateSegmentParams): Promise<Segment> {
    console.log('Creating segment with params:', {
      accountId: params.accountId,
      name: params.name,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      filtersCount: params.filters.length,
      enrichmentFieldsCount: params.enrichmentFields.length,
      customColumnsCount: params.customColumns.length,
      tagsCount: params.tags?.length || 0,
    });

    const { data, error } = await this.client
      .from('segments')
      .insert([
        {
          account_id: params.accountId,
          name: params.name,
          description: params.description,
          source_type: params.sourceType,
          source_id: params.sourceId,
          filters: params.filters,
          enrichment_fields: params.enrichmentFields,
          custom_columns: params.customColumns,
          tags: params.tags || [],
          created_by: params.createdBy, // Use the user ID from the server action
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Database error creating segment:', error);
      throw error;
    }

    console.log('Segment created successfully:', data.id);
    return data;
  }

  async getSegments(params: { accountId: string }): Promise<Segment[]> {
    const { data, error } = await this.client
      .from('segments')
      .select('*')
      .eq('account_id', params.accountId)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async getSegment(params: { segmentId: string }): Promise<Segment | null> {
    const { data, error } = await this.client
      .from('segments')
      .select('*')
      .eq('id', params.segmentId)
      .eq('deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  }

  async updateSegment(params: {
    segmentId: string;
    name?: string;
    description?: string;
    tags?: string[];
  }): Promise<Segment> {
    const { data, error } = await this.client
      .from('segments')
      .update({
        name: params.name,
        description: params.description,
        tags: params.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.segmentId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteSegment(params: { segmentId: string }): Promise<void> {
    const { error } = await this.client
      .from('segments')
      .update({ deleted: true })
      .eq('id', params.segmentId);

    if (error) {
      throw error;
    }
  }

  async generateSegmentName(params: {
    sourceType: 'audience' | 'webhook_upload' | 'csv_upload' | 'batch_upload';
    sourceId: string;
    baseName?: string;
  }): Promise<string> {
    if (params.sourceType === 'audience') {
      // Try to get audience name
      try {
        const { data: audience, error } = await this.client
          .from('audience')
          .select('name')
          .eq('id', params.sourceId)
          .eq('deleted', false)
          .single();

        if (error) {
          console.warn('Failed to fetch audience name:', error);
        } else if (audience?.name) {
          return `${audience.name} – segment`;
        }
      } catch (error) {
        console.warn('Error fetching audience name:', error);
        // Fall back to default naming
      }
    }

    // Default naming based on source type
    const baseName = params.baseName || 'Studio Segment';
    const timestamp = new Date().toLocaleDateString();
    
    switch (params.sourceType) {
      case 'audience':
        return `${baseName} – segment`;
      case 'webhook_upload':
        return `Webhook Data – segment (${timestamp})`;
      case 'csv_upload':
        return `CSV Upload – segment (${timestamp})`;
      default:
        return `Studio Segment (${timestamp})`;
    }
  }

  async getSegmentStats(params: { accountId: string }): Promise<{
    total: number;
    bySourceType: Record<string, number>;
  }> {
    const { data, error } = await this.client
      .from('segments')
      .select('source_type')
      .eq('account_id', params.accountId)
      .eq('deleted', false);

    if (error) {
      throw error;
    }

    const total = data.length;
    const bySourceType = data.reduce((acc, segment) => {
      acc[segment.source_type] = (acc[segment.source_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, bySourceType };
  }
} 