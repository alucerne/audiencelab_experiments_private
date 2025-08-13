import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit, releaseConnection } from '../../../../../lib/duck';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Connect to DuckDB
    const con = connectAndInit();
    console.log('DuckDB connection established for durations query');

    // Query the pixel_events table for duration insights
    const durationsQuery = `
      SELECT 
        hem_sha256,
        activity_start_date as ts,
        event_type as EventType,
        CAST(
          EXTRACT(EPOCH FROM (activity_end_date - activity_start_date)) AS INTEGER
        ) as duration_seconds
      FROM pixel_events 
      WHERE activity_start_date IS NOT NULL 
        AND activity_end_date IS NOT NULL
        AND activity_start_date != activity_end_date
      ORDER BY duration_seconds DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const durationsData = await new Promise<any[]>((resolve, reject) => {
      con.all(durationsQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error querying durations data:', err);
          reject(err);
        } else {
          console.log(`Found ${rows?.length || 0} duration records`);
          // Convert any BigInt values to regular numbers
          const processedRows = (rows || []).map(row => ({
            ...row,
            duration_seconds: Number(row.duration_seconds)
          }));
          resolve(processedRows);
        }
      });
    });

    // Get total count for pagination
    const totalCountQuery = `
      SELECT CAST(COUNT(*) AS INTEGER) as total
      FROM pixel_events 
      WHERE activity_start_date IS NOT NULL 
        AND activity_end_date IS NOT NULL
        AND activity_start_date != activity_end_date
    `;

    const totalCount = await new Promise<number>((resolve, reject) => {
      con.all(totalCountQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error getting total count:', err);
          reject(err);
        } else {
          const count = Number(rows?.[0]?.total || 0);
          console.log('Total durations count:', count);
          resolve(count);
        }
      });
    });

    // Calculate duration statistics
    const statsQuery = `
      SELECT 
        CAST(COUNT(*) AS INTEGER) as total_sessions,
        CAST(AVG(EXTRACT(EPOCH FROM (activity_end_date - activity_start_date))) AS INTEGER) as avg_duration_seconds,
        CAST(MAX(EXTRACT(EPOCH FROM (activity_end_date - activity_start_date))) AS INTEGER) as max_duration_seconds,
        CAST(MIN(EXTRACT(EPOCH FROM (activity_end_date - activity_start_date))) AS INTEGER) as min_duration_seconds,
        CAST(SUM(EXTRACT(EPOCH FROM (activity_end_date - activity_start_date))) AS INTEGER) as total_duration_seconds
      FROM pixel_events 
      WHERE activity_start_date IS NOT NULL 
        AND activity_end_date IS NOT NULL
        AND activity_start_date != activity_end_date
    `;

    const statsData = await new Promise<any>((resolve, reject) => {
      con.all(statsQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error getting stats:', err);
          reject(err);
        } else {
          const stats = rows?.[0] || {};
          resolve({
            total_sessions: Number(stats.total_sessions || 0),
            average_duration_seconds: Number(stats.avg_duration_seconds || 0),
            average_duration_formatted: formatDuration(Number(stats.avg_duration_seconds || 0)),
            total_duration_seconds: Number(stats.total_duration_seconds || 0),
            total_duration_formatted: formatDuration(Number(stats.total_duration_seconds || 0)),
            longest_session_seconds: Number(stats.max_duration_seconds || 0),
            longest_session_formatted: formatDuration(Number(stats.max_duration_seconds || 0)),
            shortest_session_seconds: Number(stats.min_duration_seconds || 0),
            shortest_session_formatted: formatDuration(Number(stats.min_duration_seconds || 0))
          });
        }
      });
    });

    // Release connection
    releaseConnection(con);

    return NextResponse.json({
      success: true,
      rows: durationsData,
      stats: statsData,
      pagination: {
        limit,
        offset,
        total: totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching duration data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duration data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
} 