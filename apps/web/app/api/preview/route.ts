import { NextRequest, NextResponse } from 'next/server';

// Simple CSV parser for Vercel deployment (no native dependencies)
async function parseCSV(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Parse data rows
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      return row;
    });
    
    return rows;
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw error;
  }
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

    if (!audience || !audience.url || !audience.format) {
      return NextResponse.json(
        { error: 'audience.url and audience.format are required' },
        { status: 400 }
      );
    }

    // For Vercel deployment, only support CSV for now
    if (audience.format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is supported in this deployment' },
        { status: 400 }
      );
    }

    // Parse CSV data
    const allRows = await parseCSV(audience.url);
    
    // Apply column selection
    let filteredRows = allRows;
    if (select.length > 0) {
      filteredRows = allRows.map(row => {
        const filtered: any = {};
        select.forEach(key => {
          if (row.hasOwnProperty(key)) {
            filtered[key] = row[key];
          }
        });
        return filtered;
      });
    }
    
    // Apply pagination
    const startIndex = Math.max(0, Number(offset) || 0);
    const endIndex = startIndex + Math.min(1000, Number(limit) || 200);
    const paginatedRows = filteredRows.slice(startIndex, endIndex);

    return NextResponse.json({
      rows: paginatedRows,
      limit: Number(limit) || 200,
      offset: Number(offset) || 0,
      total: filteredRows.length
    });

  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: `Preview failed: ${error.message}` },
      { status: 500 }
    );
  }
} 