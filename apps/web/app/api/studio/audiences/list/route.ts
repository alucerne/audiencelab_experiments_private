import { NextRequest, NextResponse } from 'next/server';
import { listSegments } from '~/lib/segments';
import { PREDEFINED_SOURCES } from '~/lib/predefinedAudiences';

// Get base audiences from predefined sources
async function getBaseAudiences() {
  return PREDEFINED_SOURCES.map(source => ({
    id: source.id,
    name: source.name,
    kind: source.kind,
    url: source.url,
    format: source.format
  }));
}

export async function GET(request: NextRequest) {
  try {
    const bases = await getBaseAudiences();
    const segs = listSegments().map(s => ({
      id: s.id,
      name: s.name,
      kind: 'segment' as const,
      parent_audience_id: s.parent_audience_id,
      created_at: s.created_at
    }));

    return NextResponse.json({ items: [...bases, ...segs] });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list audiences',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 