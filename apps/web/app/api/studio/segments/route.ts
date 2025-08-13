import { NextRequest, NextResponse } from 'next/server';
import { duckDBService, Segment } from '../../../../app/home/[account]/studio/utils/duckDBService';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const { name, selectedFields, filters, account_id } = await request.json();

    if (!name || !account_id) {
      return NextResponse.json(
        { error: 'name and account_id are required', success: false },
        { status: 400 }
      );
    }

    // Initialize DuckDB if not already done
    await duckDBService.initialize();

    // Create segment in DuckDB
    const segmentId = await duckDBService.createSegment({
      name,
      selectedFields: selectedFields || [],
      filters: filters || [],
      account_id
    });

    // Save segment metadata to Supabase
    const supabase = getSupabaseServerClient();
    const { data: segment, error } = await supabase
      .from('studio_segments')
      .insert({
        id: segmentId,
        name,
        selected_fields: selectedFields || [],
        filters: filters || [],
        account_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving segment to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to save segment metadata', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      segment: {
        id: segmentId,
        name,
        selectedFields: selectedFields || [],
        filters: filters || [],
        account_id,
        created_at: segment.created_at
      }
    });

  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account_id = searchParams.get('account_id');

    if (!account_id) {
      return NextResponse.json(
        { error: 'account_id is required', success: false },
        { status: 400 }
      );
    }

    // Get segments from Supabase
    const supabase = getSupabaseServerClient();
    const { data: segments, error } = await supabase
      .from('studio_segments')
      .select('*')
      .eq('account_id', account_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching segments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch segments', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      segments: segments || []
    });

  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
} 