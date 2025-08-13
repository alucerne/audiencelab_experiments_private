import { NextRequest, NextResponse } from 'next/server';
import { listSegments } from '~/lib/segments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parent_audience_id = searchParams.get('parent_audience_id') || undefined;
    
    const segments = listSegments(parent_audience_id);
    
    return NextResponse.json({ items: segments });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list segments',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 