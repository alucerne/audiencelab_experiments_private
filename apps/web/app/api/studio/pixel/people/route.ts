import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit, releaseConnection } from '../../../../../lib/duck';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Connect to DuckDB
    const con = connectAndInit();
    console.log('DuckDB connection established for people query');

    // Query the pixel_events table to get people insights
    const peopleQuery = `
      SELECT 
        hem_sha256,
        CAST(COUNT(*) AS INTEGER) as events_count,
        MIN(event_timestamp) as first_seen,
        MAX(event_timestamp) as last_seen,
        CAST(COUNT(DISTINCT event_type) AS INTEGER) as unique_event_types,
        MAX(resolution) as resolution
      FROM pixel_events 
      WHERE hem_sha256 IS NOT NULL AND hem_sha256 != ''
      GROUP BY hem_sha256
      ORDER BY events_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const peopleData = await new Promise<any[]>((resolve, reject) => {
      con.all(peopleQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error querying people data:', err);
          reject(err);
        } else {
          console.log(`Found ${rows?.length || 0} people records`);
          // Convert any BigInt values to regular numbers
          const processedRows = (rows || []).map(row => ({
            ...row,
            events_count: Number(row.events_count),
            unique_event_types: Number(row.unique_event_types)
          }));
          resolve(processedRows);
        }
      });
    });

    // Get total count for pagination
    const totalCountQuery = `
      SELECT CAST(COUNT(DISTINCT hem_sha256) AS INTEGER) as total
      FROM pixel_events 
      WHERE hem_sha256 IS NOT NULL AND hem_sha256 != ''
    `;

    const totalCount = await new Promise<number>((resolve, reject) => {
      con.all(totalCountQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error getting total count:', err);
          reject(err);
        } else {
          const count = Number(rows?.[0]?.total || 0);
          console.log('Total people count:', count);
          resolve(count);
        }
      });
    });

    // Release connection
    releaseConnection(con);

    return NextResponse.json({
      success: true,
      rows: peopleData,
      pagination: {
        limit,
        offset,
        total: totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching people data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 