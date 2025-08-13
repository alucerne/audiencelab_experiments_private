import { NextRequest, NextResponse } from 'next/server';
import { getConn } from '~/lib/duck';

// Simple in-memory cache
let LAST_SOURCE_KEY: string | null = null;

function sourceKey(audience: { url?: string; format?: string }) {
  return `${audience?.url ?? ''}|${audience?.format ?? ''}`;
}

// Convert BigInt values to regular numbers for JSON serialization
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      audience, 
      select = [], 
      limit = 200, 
      offset = 0 
    } = body;

    // Validate required parameters
    if (!audience || !audience.url || !audience.format) {
      return NextResponse.json(
        { error: 'audience.url and audience.format are required' },
        { status: 400 }
      );
    }

    // Get DuckDB connection
    const con = getConn();

    // 1) Load audience (if needed)
    const key = sourceKey(audience);
    if (!LAST_SOURCE_KEY || LAST_SOURCE_KEY !== key) {
      console.log('Loading new dataset:', key);
      
      const loaderSQL = audience.format === 'parquet' 
        ? `DROP TABLE IF EXISTS studio_current; CREATE TABLE studio_current AS SELECT * FROM read_parquet('${audience.url}');`
        : `DROP TABLE IF EXISTS studio_current; CREATE TABLE studio_current AS SELECT * FROM read_csv_auto('${audience.url}', header=true);`;
      
      await new Promise<void>((resolve, reject) => {
        con.run(loaderSQL, (e: any) => e ? reject(e) : resolve());
      });

      LAST_SOURCE_KEY = key;
    }

    // 2) Build SELECT clause
    const selectClause = select.length > 0 
      ? select.map((s: string) => `"${s}"`).join(', ')
      : '*';

    // 3) Execute query
    const sql = `
      SELECT ${selectClause}
      FROM studio_current
      LIMIT ${Math.min(1000, Number(limit) || 200)}
      OFFSET ${Math.max(0, Number(offset) || 0)}
    `;

    const rows = await new Promise<any[]>((resolve, reject) => {
      con.all(sql, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Convert BigInts and return
    const convertedRows = convertBigInts(rows);
    
    return NextResponse.json({
      rows: convertedRows,
      loaded: LAST_SOURCE_KEY,
      limit,
      offset,
      total: convertedRows.length
    });

  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: `Preview failed: ${error.message}` },
      { status: 500 }
    );
  }
} 