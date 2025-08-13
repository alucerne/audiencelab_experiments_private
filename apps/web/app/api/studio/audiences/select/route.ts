import { NextRequest, NextResponse } from 'next/server';
import { PREDEFINED_SOURCES } from '~/lib/predefinedAudiences';

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
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    
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
    const { audienceId } = body;

    if (!audienceId) {
      return NextResponse.json(
        { error: 'audienceId is required' },
        { status: 400 }
      );
    }

    // Find the predefined audience
    const audience = PREDEFINED_SOURCES.find(source => source.id === audienceId);
    if (!audience) {
      return NextResponse.json(
        { error: `Audience with id ${audienceId} not found` },
        { status: 404 }
      );
    }

    // For Vercel deployment, only support CSV for now
    if (audience.format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is supported in this deployment' },
        { status: 400 }
      );
    }

    // Parse CSV data to get field information
    const rows = await parseCSV(audience.url);
    
    if (rows.length === 0) {
      return NextResponse.json({
        fields: [],
        message: 'No data found in the CSV file'
      });
    }

    // Extract field names from the first row
    const fields = Object.keys(rows[0]).map(fieldName => ({
      name: fieldName,
      type: 'string', // Simplified for Vercel deployment
      expression: fieldName
    }));

    return NextResponse.json({
      fields,
      audience: {
        id: audience.id,
        name: audience.name,
        url: audience.url,
        format: audience.format,
        kind: audience.kind
      }
    });

  } catch (error: any) {
    console.error('Audience select error:', error);
    return NextResponse.json(
      { error: `Audience select failed: ${error.message}` },
      { status: 500 }
    );
  }
} 