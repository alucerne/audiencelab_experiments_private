import { NextRequest, NextResponse } from 'next/server';
import { getConn } from '~/lib/duck';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      audience,
      select = [],
      limit = 200,
      offset = 0
    } = body;

    if (!audience || !audience.url || !audience.format) {
      return NextResponse.json(
        { error: 'audience.url and audience.format are required' },
        { status: 400 }
      );
    }

    const con = getConn();

    // Load data
    const loaderSQL = audience.format === 'parquet'
      ? `DROP TABLE IF EXISTS data_preview_current; CREATE TABLE data_preview_current AS SELECT * FROM read_parquet('${audience.url}');`
      : `DROP TABLE IF EXISTS data_preview_current; CREATE TABLE data_preview_current AS SELECT * FROM read_csv_auto('${audience.url}', header=true);`;

    await new Promise<void>((resolve, reject) => {
      con.run(loaderSQL, (e: any) => e ? reject(e) : resolve());
    });

    // Build SELECT clause
    const selectClause = select.length > 0
      ? select.map((s: string) => `"${s}"`).join(', ')
      : '*';

    // Execute query
    const sql = `
      SELECT ${selectClause}
      FROM data_preview_current
      LIMIT ${Math.min(1000, Number(limit) || 200)}
      OFFSET ${Math.max(0, Number(offset) || 0)}
    `;

    const rows = await new Promise<any[]>((resolve, reject) => {
      con.all(sql, (err: any, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Convert BigInts
    const convertedRows = rows.map(row => {
      const converted: any = {};
      for (const [key, value] of Object.entries(row)) {
        converted[key] = typeof value === 'bigint' ? Number(value) : value;
      }
      return converted;
    });

    return NextResponse.json({
      rows: convertedRows,
      limit,
      offset,
      total: convertedRows.length
    });

  } catch (error: any) {
    console.error('Data preview error:', error);
    return NextResponse.json(
      { error: `Data preview failed: ${error.message}` },
      { status: 500 }
    );
  }
} 