import { NextRequest, NextResponse } from 'next/server';
import { getConn } from '../../../../../lib/duck';

// Live API configuration
const LIVE_PIXEL_API_URL = 'https://v3-api-job-72802495918.us-east1.run.app';
const LIVE_API_KEY = 'sk_2ly5wEhHTmNyMZCc910W7OaMpuuuAhRqMXOtQM';

interface LivePixelEvent {
  pixel_id: string;
  hem_sha256: string;
  event_timestamp: string;
  event_type: string;
  ip_address: string;
  activity_start_date: string;
  activity_end_date: string;
  referrer_url: string;
  resolution: Record<string, any>;
  event_data: Record<string, any>;
}

interface LivePixelResponse {
  total_records: number;
  page_size: number;
  page: number;
  total_pages: number;
  events: LivePixelEvent[];
}

export async function GET(request: any) {
  try {
    const { searchParams } = new URL(request.url);
    const pixelId = searchParams.get('pixel_id') || '191051fb-e899-46c6-86de-fd778d8b0397';
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('page_size') || '100';

    console.log(`Fetching live pixel data for pixel_id: ${pixelId}, page: ${page}, page_size: ${pageSize}`);

    // Fetch data from live API
    const apiUrl = `${LIVE_PIXEL_API_URL}/pixel/fetch?page=${page}&page_size=${pageSize}&pixel_id=${pixelId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': LIVE_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Live API request failed: ${response.status} ${response.statusText}`);
    }

    const liveData: LivePixelResponse = await response.json();
    console.log(`Received ${liveData.total_records} total records from live API (page ${liveData.page} of ${liveData.total_pages})`);

    if (!liveData.events || liveData.events.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No events found in live API response',
        rowCount: 0,
        note: 'Live API returned no data',
        pagination: {
          total_records: liveData.total_records,
          page_size: liveData.page_size,
          page: liveData.page,
          total_pages: liveData.total_pages
        }
      });
    }

    // Connect to DuckDB
    const con = getConn();
    console.log('DuckDB connection established');

    // Drop existing table if it exists
    await new Promise<void>((resolve, reject) => {
      con.run(`DROP TABLE IF EXISTS pixel_events`, (err: any) => {
        if (err) {
          console.log('Error dropping table (this is usually fine):', err);
        }
        resolve();
      });
    });

    console.log('Creating pixel_events table...');

    // Create table for pixel events
    await new Promise<void>((resolve, reject) => {
      con.run(`
        CREATE TABLE pixel_events (
          pixel_id VARCHAR,
          hem_sha256 VARCHAR,
          event_timestamp TIMESTAMP,
          event_type VARCHAR,
          ip_address VARCHAR,
          activity_start_date TIMESTAMP,
          activity_end_date TIMESTAMP,
          event_data JSON,
          referrer_url VARCHAR,
          resolution JSON
        )
      `, (err: any) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
        } else {
          console.log('Table created successfully');
          resolve();
        }
      });
    });

    console.log('Inserting live data...');

    // Insert live data one by one to avoid race conditions
    let insertedCount = 0;
    for (const event of liveData.events) {
      await new Promise<void>((resolve, reject) => {
        const sql = `
          INSERT INTO pixel_events (
            pixel_id, hem_sha256, event_timestamp, event_type, ip_address, 
            activity_start_date, activity_end_date, event_data, referrer_url, resolution
          ) VALUES (
            '${event.pixel_id}',
            '${event.hem_sha256}',
            '${event.event_timestamp}',
            '${event.event_type}',
            '${event.ip_address}',
            '${event.activity_start_date}',
            '${event.activity_end_date}',
            '${JSON.stringify(event.event_data || {}).replace(/'/g, "''")}',
            '${event.referrer_url}',
            '${JSON.stringify(event.resolution || {}).replace(/'/g, "''")}'
          )
        `;
        
        con.run(sql, (err: any) => {
          if (err) {
            console.error('Error inserting event:', event.pixel_id, err);
            reject(err);
          } else {
            insertedCount++;
            if (insertedCount % 10 === 0) {
              console.log(`Inserted ${insertedCount} events...`);
            }
            resolve();
          }
        });
      });
    }

    console.log(`Live data inserted successfully: ${insertedCount} events`);

    // Get row count
    const rowCount = await new Promise<number>((resolve, reject) => {
      con.all('SELECT COUNT(*) as count FROM pixel_events', (err: any, rows: any[]) => {
        if (err) {
          console.error('Error getting row count:', err);
          reject(err);
        } else {
          const count = Number(rows?.[0]?.count || 0);
          console.log('Row count result:', rows, 'Count:', count);
          resolve(count);
        }
      });
    });

    console.log('Final row count:', rowCount);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${rowCount} live pixel events`,
      rowCount,
      note: 'Live API data imported. You can now use the preview functionality.',
      apiInfo: {
        pixelId,
        page: liveData.page,
        pageSize: liveData.page_size,
        totalRecords: liveData.total_records,
        totalPages: liveData.total_pages,
        eventsInThisPage: liveData.events.length
      },
      pagination: {
        total_records: liveData.total_records,
        page_size: liveData.page_size,
        page: liveData.page,
        total_pages: liveData.total_pages
      }
    });

  } catch (error) {
    console.error('Error fetching live pixel data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch live pixel data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pixel_id, page = 1, page_size = 100 } = await request.json();
    
    if (!pixel_id) {
      return NextResponse.json(
        { error: 'pixel_id is required' },
        { status: 400 }
      );
    }

    // Create a new request with the provided parameters
    const newRequest = new NextRequest(
      `${request.nextUrl.origin}/api/studio/pixel/fetch-live?pixel_id=${pixel_id}&page=${page}&page_size=${page_size}`,
      { method: 'GET' }
    );

    return GET(newRequest);

  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process POST request', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 