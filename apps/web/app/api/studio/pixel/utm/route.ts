import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit, releaseConnection } from '../../../../../lib/duck';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Connect to DuckDB
    const con = connectAndInit();
    console.log('DuckDB connection established for UTM query');

    // Query the pixel_events table for UTM insights
    // Extract UTM parameters from referrer_url and event_data
    const utmQuery = `
      SELECT 
        CASE 
          WHEN referrer_url LIKE '%utm_source=%' THEN 
            SUBSTRING(referrer_url, 
              POSITION('utm_source=' IN referrer_url) + 11,
              CASE 
                WHEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11)) > 0 
                THEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11)) - 1
                ELSE LENGTH(SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11))
              END
            )
          ELSE 'direct'
        END as utm_source,
        CASE 
          WHEN referrer_url LIKE '%utm_medium=%' THEN 
            SUBSTRING(referrer_url, 
              POSITION('utm_medium=' IN referrer_url) + 11,
              CASE 
                WHEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_medium=' IN referrer_url) + 11)) > 0 
                THEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_medium=' IN referrer_url) + 11)) - 1
                ELSE LENGTH(SUBSTRING(referrer_url, POSITION('utm_medium=' IN referrer_url) + 11))
              END
            )
          ELSE 'none'
        END as utm_medium,
        CASE 
          WHEN referrer_url LIKE '%utm_campaign=%' THEN 
            SUBSTRING(referrer_url, 
              POSITION('utm_campaign=' IN referrer_url) + 13,
              CASE 
                WHEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_campaign=' IN referrer_url) + 13)) > 0 
                THEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_campaign=' IN referrer_url) + 13)) - 1
                ELSE LENGTH(SUBSTRING(referrer_url, POSITION('utm_campaign=' IN referrer_url) + 13))
              END
            )
          ELSE 'none'
        END as utm_campaign,
        CAST(COUNT(*) AS INTEGER) as events
      FROM pixel_events 
      WHERE referrer_url IS NOT NULL AND referrer_url != ''
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY events DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const utmData = await new Promise<any[]>((resolve, reject) => {
      con.all(utmQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error querying UTM data:', err);
          reject(err);
        } else {
          console.log(`Found ${rows?.length || 0} UTM records`);
          // Convert any BigInt values to regular numbers
          const processedRows = (rows || []).map(row => ({
            ...row,
            events: Number(row.events)
          }));
          resolve(processedRows);
        }
      });
    });

    // Get total count for pagination
    const totalCountQuery = `
      SELECT CAST(COUNT(DISTINCT 
        CASE 
          WHEN referrer_url LIKE '%utm_source=%' THEN 
            SUBSTRING(referrer_url, 
              POSITION('utm_source=' IN referrer_url) + 11,
              CASE 
                WHEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11)) > 0 
                THEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11)) - 1
                ELSE LENGTH(SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11))
              END
            )
          ELSE 'direct'
        END
      ) AS INTEGER) as total
      FROM pixel_events 
      WHERE referrer_url IS NOT NULL AND referrer_url != ''
    `;

    const totalCount = await new Promise<number>((resolve, reject) => {
      con.all(totalCountQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error getting total count:', err);
          reject(err);
        } else {
          const count = Number(rows?.[0]?.total || 0);
          console.log('Total UTM sources count:', count);
          resolve(count);
        }
      });
    });

    // Calculate UTM summary statistics
    const summaryQuery = `
      SELECT 
        CAST(COUNT(*) AS INTEGER) as total_events,
        CAST(COUNT(DISTINCT hem_sha256) AS INTEGER) as total_unique_users,
        CAST(COUNT(DISTINCT 
          CASE 
            WHEN referrer_url LIKE '%utm_source=%' THEN 
              SUBSTRING(referrer_url, 
                POSITION('utm_source=' IN referrer_url) + 11,
                CASE 
                  WHEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11)) > 0 
                  THEN POSITION('&' IN SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11)) - 1
                  ELSE LENGTH(SUBSTRING(referrer_url, POSITION('utm_source=' IN referrer_url) + 11))
                END
              )
            ELSE 'direct'
          END
        ) AS INTEGER) as total_campaigns
      FROM pixel_events 
      WHERE referrer_url IS NOT NULL AND referrer_url != ''
    `;

    const summaryData = await new Promise<any>((resolve, reject) => {
      con.all(summaryQuery, (err: any, rows: any[]) => {
        if (err) {
          console.error('Error getting summary:', err);
          reject(err);
        } else {
          const summary = rows?.[0] || {};
          resolve({
            total_campaigns: Number(summary.total_campaigns || 0),
            total_events: Number(summary.total_events || 0),
            total_unique_users: Number(summary.total_unique_users || 0),
            overall_conversion_rate: 0, // Would need conversion data to calculate
            total_revenue: 0, // Would need revenue data to calculate
            top_performing_source: utmData[0]?.utm_source || 'none',
            top_performing_campaign: utmData[0]?.utm_campaign || 'none'
          });
        }
      });
    });

    // Release connection
    releaseConnection(con);

    return NextResponse.json({
      success: true,
      rows: utmData,
      summary: summaryData,
      pagination: {
        limit,
        offset,
        total: totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching UTM data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UTM data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 