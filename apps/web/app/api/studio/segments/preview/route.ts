import { NextRequest, NextResponse } from 'next/server';
import { getSegment } from '~/lib/segments';
import { getConn } from '~/lib/duck';
import { createDuckDBServiceAdapter } from '~/lib/unifiedDataLoader';
import { loadToStudioCurrent, buildFiltersView } from '~/lib/unifiedDataLoader';
import { runPreview } from '~/lib/unifiedQueryService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segment_id, limit = 200, offset = 0 } = body;
    
    if (!segment_id) {
      return NextResponse.json({ error: 'segment_id required' }, { status: 400 });
    }

    const seg = getSegment(segment_id);
    if (!seg) {
      return NextResponse.json({ error: 'segment not found' }, { status: 404 });
    }

    const connection = await getConn();
    const duckDBService = createDuckDBServiceAdapter(connection);

    try {
      // 1) Reload source dataset into studio_current
      await loadToStudioCurrent(duckDBService, {
        url: seg.source_url,
        format: seg.format,
        audience_id: seg.parent_audience_id
      });

      // 2) Rebuild view
      await buildFiltersView(duckDBService, {
        url: seg.source_url,
        format: seg.format,
        audience_id: seg.parent_audience_id
      });

      // 3) Run query with stored filterTree + selectedFields
      const previewResult = await runPreview(duckDBService, {
        limit: Math.min(1000, Number(limit) || 200),
        offset: Math.max(0, Number(offset) || 0),
        where: seg.filterTree,
        select: seg.selectedFields.length > 0 ? seg.selectedFields : undefined
      });

      return NextResponse.json({ 
        rows: previewResult.rows, 
        segment: { id: seg.id, name: seg.name },
        limit: previewResult.limit,
        offset: previewResult.offset
      });

    } finally {
      connection.close();
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to preview segment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 