import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit } from '../../../../../lib/duck';

export async function POST(request: NextRequest) {
  try {
    const con = connectAndInit();
    
    // Create studio_current table from pixel_events
    const sql = `
DROP TABLE IF EXISTS studio_current;
CREATE TABLE studio_current AS 
SELECT * FROM pixel_events;
`;

    await new Promise<void>((resolve, reject) => {
      con.run(sql, (err: any) => {
        if (err) {
          console.error('Error creating studio_current table:', err);
          reject(err);
        } else {
          console.log('studio_current table created successfully');
          resolve();
        }
      });
    });

    // Get row count to verify
    return new Promise((resolve) => {
      con.all('SELECT COUNT(*) AS cnt FROM studio_current', (err: any, rows: any[]) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          const count = Number(rows?.[0]?.cnt || 0);
          resolve(NextResponse.json({ 
            status: 'ok', 
            message: `studio_current table created with ${count} rows`,
            rowCount: count
          }));
        }
      });
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 