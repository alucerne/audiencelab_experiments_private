// lib/pixelDuck.ts
import duckdb from 'duckdb';
import path from 'path';
import { promises as fs } from 'fs';

let _db: duckdb.Database | null = null;

export function getDB() {
  if (_db) return _db;
  _db = new duckdb.Database(':memory:'); // one DB per process
  return _db;
}

export async function loadLocalJsonIntoDuck(tableName: string, relativeJsonPath: string) {
  const db = getDB();
  const con = db.connect();
  const abs = path.join(process.cwd(), 'public', relativeJsonPath);

  try {
    await fs.access(abs);
  } catch {
    throw new Error(`JSON not found: ${abs}`);
  }

  // Create table (DuckDB can read JSON via read_json_auto)
  await new Promise<void>((resolve, reject) => {
    con.run(
      `CREATE OR REPLACE TABLE ${tableName} AS
       SELECT
         e.pixel_id AS PixelID,
         e.hem_sha256 AS HemSha256,
         CAST(e.event_timestamp AS TIMESTAMP) AS EventTimestamp,
         e.event_type AS EventType,
         e.ip_address AS IPAddress,
         CAST(e.activity_start_date AS TIMESTAMP) AS ActivityStartDate,
         CAST(e.activity_end_date AS TIMESTAMP) AS ActivityEndDate,
         e.referrer_url AS ReferrerUrl,
         e.event_data AS event_data, -- JSON
         e.resolution AS resolution -- JSON
       FROM read_json_auto('${abs}', -- top-level object { events: [...] }
         format='array',
         records=false
       ) t, UNNEST(t.events) AS e;`,
      (err: any) => (err ? reject(err) : resolve())
    );
  });

  con.close();
} 