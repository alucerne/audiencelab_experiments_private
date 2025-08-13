import { NextRequest, NextResponse } from 'next/server';
import { getConn } from '../../../../../lib/duck';
import { loadData, LoadOptions, createDuckDBServiceAdapter } from '../../../../../lib/unifiedDataLoader';

// Helper function to convert BigInt to regular numbers for JSON serialization
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
    console.log('API received request body:', body);
    
    let url: string | undefined;
    let format = 'csv';
    
    // Handle new format (url/format) - prioritize this over old format
    if (body.url) {
      url = body.url;
      format = body.format || 'csv';
    } else if (body.id && body.type) {
      // Handle old format (id/type) - only if no URL is provided
      // For now, just return an error asking for URL format
      return NextResponse.json({ 
        error: 'Please use the new format with url and format parameters',
        details: 'Old format (id/type) is deprecated. Use { url: "gcs_url", format: "csv" }'
      }, { status: 400 });
    } else {
      // No URL provided and no old format - return error
      return NextResponse.json({ 
        error: 'No URL provided for loading',
        details: 'Please provide a url parameter to load data from GCS'
      }, { status: 400 });
    }

    // Only proceed with URL loading if we have a URL
    if (!url) {
      return NextResponse.json({ error: 'No URL provided for loading' }, { status: 400 });
    }

    console.log(`Loading data from: ${url} (format: ${format})`);

    const con = getConn();
    const duckDBService = createDuckDBServiceAdapter(con);

    // Use the unified data loader
    const loadOptions: LoadOptions = {
      url,
      format: format as 'csv' | 'parquet' | 'json',
      audience_id: body.id
    };

    try {
      const result = await loadData(duckDBService, loadOptions);

      if (result.status === 'error') {
        return NextResponse.json({ 
          error: result.error || 'Failed to load data',
          details: 'The unified data loader encountered an error'
        }, { status: 500 });
      }

      console.log(`Successfully loaded ${result.loaded_rows} rows and created view with ${result.view_rows} rows`);

      // Determine audience name based on URL
      let audienceName = 'Custom Audience';
      if (url.includes('Pixel_Local_Test')) {
        audienceName = 'Pixel Local Test - Random Contacts';
      }

      return NextResponse.json({
        status: 'ok',
        loaded: body.id ? { id: body.id, type: body.type || 'audience' } : { 
          name: audienceName,
          url, 
          format 
        },
        loaded_rows: result.loaded_rows,
        view_rows: result.view_rows,
        catalog: result.catalog,
        duration_ms: result.duration_ms,
        url_hash: result.url_hash,
        message: `Successfully loaded ${result.loaded_rows} rows and created unified view with ${result.view_rows} rows`
      });

    } catch (error) {
      console.error('Error in unified data loader:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'The unified data loader failed'
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error('Error loading data:', e);
    return NextResponse.json({ 
      error: e.message,
      details: 'Failed to load data. The operation may have timed out or the URL may not be accessible.'
    }, { status: 500 });
  }
} 