import { NextRequest, NextResponse } from 'next/server';
import { createSegment } from '~/lib/segments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parent_audience_id, source_url, format, filterTree, selectedFields = [] } = body;
    
    if (!name || !parent_audience_id || !source_url || !format || !filterTree) {
      return NextResponse.json({ 
        error: 'name, parent_audience_id, source_url, format, filterTree are required' 
      }, { status: 400 });
    }

    const suffix = ' – segment';
    const displayName = name.endsWith(suffix) ? name : name + suffix;

    const seg = createSegment({
      name: displayName,
      parent_audience_id,
      source_url,
      format,
      filterTree,
      selectedFields
    });

    return NextResponse.json({ status: 'ok', segment: seg });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to create segment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 