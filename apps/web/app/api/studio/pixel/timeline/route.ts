import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit, releaseConnection } from '../../../../../lib/duck';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Connect to DuckDB
    const con = connectAndInit();
    console.log('DuckDB connection established for timeline query');

    // Build WHERE clause based on filters
    let whereClause = 'WHERE 1=1';

    if (start) {
      whereClause += ` AND event_timestamp >= '${start}'`;
    }
    if (end) {
      whereClause += ` AND event_timestamp <= '${end}'`;
    }
    if (eventType) {
      whereClause += ` AND event_type = '${eventType}'`;
    }

    // Query the pixel_events table for timeline data
    const timelineQuery = `
      SELECT
        hem_sha256 as HemSha256,
        event_timestamp as ts,
        event_type as EventType,
        referrer_url as ReferrerUrl,
        CAST(ROW_NUMBER() OVER (PARTITION BY hem_sha256 ORDER BY event_timestamp) AS INTEGER) AS event_order
      FROM pixel_events 
      ${whereClause}
      ORDER BY hem_sha256, event_timestamp
      LIMIT ${limit}
    `;

    console.log('Timeline query:', timelineQuery);

    const timelineData = await new Promise<any[]>((resolve, reject) => {
      con.all(timelineQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error querying timeline data:', err);
          reject(err);
        } else {
          console.log(`Found ${rows?.length || 0} timeline records`);
          // Convert any BigInt values to regular numbers
          const processedRows = (rows || []).map(row => ({
            ...row,
            event_order: Number(row.event_order)
          }));
          resolve(processedRows);
        }
      });
    });

    // Release connection
    releaseConnection(con);

    return NextResponse.json({
      success: true,
      rows: timelineData
    });

  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 