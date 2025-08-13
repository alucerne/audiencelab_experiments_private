import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit, getDB, releaseConnection } from '../../../../../lib/duck';

// Sample data for testing
const sampleData = [
  {
    pixel_id: 'pixel_001',
    hem_sha256: '1458ee23320e30d920f099f57b11000b89ab82a7456bf39dd663d9d0858fd88d',
    event_timestamp: '2025-01-15T10:30:00Z',
    event_type: 'page_view',
    ip_address: '192.168.1.100',
    activity_start_date: '2025-01-15T10:30:00Z',
    activity_end_date: '2025-01-15T10:35:00Z',
    event_data: {
      referrer: 'https://google.com',
      timestamp: '2025-01-15T10:30:00Z',
      title: 'Sample Page',
      url: 'https://example.com/page1',
      percentage: 0.5
    },
    referrer_url: 'https://google.com',
    resolution: {
      FIRST_NAME: 'John',
      GENDER: 'M',
      INCOME_RANGE: '$50,000 to $74,999',
      AGE_RANGE: '35-44'
    }
  },
  {
    pixel_id: 'pixel_002',
    hem_sha256: '2b863da80b0df29ce907336f4a55c91ef9b70fdc4c3f0b05846600dd2554d56f',
    event_timestamp: '2025-01-16T09:15:00Z',
    event_type: 'click',
    ip_address: '192.168.1.101',
    activity_start_date: '2025-01-16T09:15:00Z',
    activity_end_date: '2025-01-16T09:20:00Z',
    event_data: {
      referrer: 'https://facebook.com',
      timestamp: '2025-01-16T09:15:00Z',
      title: 'Another Page',
      url: 'https://example.com/page2',
      percentage: 0.8
    },
    referrer_url: 'https://facebook.com',
    resolution: {
      FIRST_NAME: 'Sarah',
      GENDER: 'F',
      INCOME_RANGE: '$100,000 to $149,999',
      AGE_RANGE: '25-34'
    }
  }
];

export async function GET() {
  try {
    console.log('GET seed endpoint called - creating sample data');
    
    const con = connectAndInit();
    console.log('Database connection established');
    
    // Drop existing table if it exists
    await new Promise<void>((resolve, reject) => {
      con.run(`DROP TABLE IF EXISTS pixel_events`, (err: any) => {
        if (err) {
          console.log('Error dropping table (this is usually fine):', err);
          // Don't reject here, just resolve since this is usually fine
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

    console.log('Inserting sample data...');

    // Insert sample data one by one to avoid race conditions
    for (const event of sampleData) {
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
            '${JSON.stringify(event.event_data).replace(/'/g, "''")}',
            '${event.referrer_url}',
            '${JSON.stringify(event.resolution).replace(/'/g, "''")}'
          )
        `;
        
        con.run(sql, (err: any) => {
          if (err) {
            console.error('Error inserting event:', event.pixel_id, err);
            reject(err);
          } else {
            console.log('Inserted event:', event.pixel_id);
            resolve();
          }
        });
      });
    }

    console.log('Sample data inserted successfully');

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

    // Release connection before returning
    releaseConnection(con);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${rowCount} sample pixel events`,
      rowCount,
      note: 'Sample data created. You can now use the preview functionality.'
    });

  } catch (error) {
    console.error('Error seeding sample pixel data:', error);
    return NextResponse.json(
      { error: 'Failed to seed sample pixel data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    const con = connectAndInit();
    
    // Drop existing table if it exists
    await new Promise<void>((resolve) => {
      con.run(`DROP TABLE IF EXISTS pixel_events`, (err: any) => {
        if (err) console.log('Error dropping table (this is usually fine):', err);
        resolve();
      });
    });

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
        if (err) reject(err);
        else resolve();
      });
    });

    let rowCount = 0;

    // If data is provided, insert it; otherwise use sample data
    const dataToInsert = (data && Array.isArray(data) && data.length > 0) ? data : sampleData;
    
    // Insert data one by one to avoid race conditions
    for (const event of dataToInsert) {
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
            '${JSON.stringify(event.event_data).replace(/'/g, "''")}',
            '${event.referrer_url}',
            '${JSON.stringify(event.resolution).replace(/'/g, "''")}'
          )
        `;
        
        con.run(sql, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Get row count
    rowCount = await new Promise<number>((resolve, reject) => {
      con.all('SELECT COUNT(*) as count FROM pixel_events', (err: any, rows: any[]) => {
        if (err) {
          releaseConnection(con);
          reject(err);
        } else {
          resolve(Number(rows?.[0]?.count || 0));
        }
      });
    });

    // Release connection before returning
    releaseConnection(con);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${rowCount} pixel events`,
      rowCount,
      note: data && Array.isArray(data) && data.length > 0 
        ? 'Custom data inserted' 
        : 'Sample data inserted'
    });

  } catch (error) {
    console.error('Error seeding pixel data:', error);
    // Note: con is not in scope here, so we can't release it
    return NextResponse.json(
      { error: 'Failed to seed pixel data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 