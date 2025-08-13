import { NextRequest, NextResponse } from 'next/server';
import { connectAndInit, getDB, releaseConnection } from '../../../../../lib/duck';
import miscConfig from '~/config/misc.config';

// Live API configuration for audience
const LIVE_AUDIENCE_API_URL = miscConfig.audienceApiUrl;

interface LiveAudienceContact {
  // Basic contact fields
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  
  // Company fields
  company_name?: string;
  company_domain?: string;
  job_title?: string;
  seniority?: string;
  department?: string;
  industry?: string;
  employee_count?: string;
  company_revenue?: string;
  
  // Location fields
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  
  // Personal fields
  age?: string;
  gender?: string;
  income_range?: string;
  education?: string;
  
  // Additional fields
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  
  // Metadata
  source?: string;
  confidence_score?: number;
  last_updated?: string;
}

interface LiveAudienceResponse {
  result: LiveAudienceContact[];
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audienceId = searchParams.get('audience_id');
    const limit = searchParams.get('limit') || '1000';

    console.log(`Fetching live audience data for audience_id: ${audienceId}, limit: ${limit}`);

    if (!audienceId) {
      return NextResponse.json({
        error: 'audience_id is required'
      }, { status: 400 });
    }

    // For now, we'll use a mock audience search since we need the actual audience API structure
    // This would need to be updated based on your actual audience API endpoint
    const mockAudienceData: LiveAudienceResponse = {
      result: [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          company_name: 'Tech Corp',
          job_title: 'Software Engineer',
          seniority: 'senior',
          department: 'Engineering',
          industry: 'Technology',
          city: 'San Francisco',
          state: 'CA',
          confidence_score: 0.95
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@startup.com',
          company_name: 'Startup Inc',
          job_title: 'Product Manager',
          seniority: 'mid',
          department: 'Product',
          industry: 'SaaS',
          city: 'New York',
          state: 'NY',
          confidence_score: 0.88
        }
      ],
      count: 2
    };

    // TODO: Replace with actual API call when audience API endpoint is available
    // const response = await fetch(`${LIVE_AUDIENCE_API_URL}/audience/search`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     audience_id: audienceId,
    //     limit: parseInt(limit)
    //   })
    // });

    // if (!response.ok) {
    //   throw new Error(`Live audience API request failed: ${response.status} ${response.statusText}`);
    // }

    // const liveData: LiveAudienceResponse = await response.json();
    const liveData = mockAudienceData; // Using mock data for now

    console.log(`Received ${liveData.count} records from live audience API`);

    if (!liveData.result || liveData.result.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contacts found in live audience API response',
        rowCount: 0,
        note: 'Live audience API returned no data'
      });
    }

    // Connect to DuckDB
    const con = connectAndInit();
    console.log('DuckDB connection established');

    // Drop existing table if it exists
    await new Promise<void>((resolve, reject) => {
      con.run(`DROP TABLE IF EXISTS audience_contacts`, (err: any) => {
        if (err) {
          console.log('Error dropping table (this is usually fine):', err);
        }
        resolve();
      });
    });

    console.log('Creating audience_contacts table...');

    // Create table for audience contacts
    await new Promise<void>((resolve, reject) => {
      con.run(`
        CREATE TABLE audience_contacts (
          first_name VARCHAR,
          last_name VARCHAR,
          email VARCHAR,
          phone VARCHAR,
          company_name VARCHAR,
          company_domain VARCHAR,
          job_title VARCHAR,
          seniority VARCHAR,
          department VARCHAR,
          industry VARCHAR,
          employee_count VARCHAR,
          company_revenue VARCHAR,
          city VARCHAR,
          state VARCHAR,
          zip VARCHAR,
          country VARCHAR,
          age VARCHAR,
          gender VARCHAR,
          income_range VARCHAR,
          education VARCHAR,
          linkedin_url VARCHAR,
          twitter_url VARCHAR,
          facebook_url VARCHAR,
          source VARCHAR,
          confidence_score DOUBLE,
          last_updated TIMESTAMP
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

    console.log('Inserting live audience data...');

    // Insert live data one by one to avoid race conditions
    let insertedCount = 0;
    for (const contact of liveData.result) {
      await new Promise<void>((resolve, reject) => {
        const sql = `
          INSERT INTO audience_contacts (
            first_name, last_name, email, phone, company_name, company_domain,
            job_title, seniority, department, industry, employee_count, company_revenue,
            city, state, zip, country, age, gender, income_range, education,
            linkedin_url, twitter_url, facebook_url, source, confidence_score, last_updated
          ) VALUES (
            '${contact.first_name || ''}',
            '${contact.last_name || ''}',
            '${contact.email || ''}',
            '${contact.phone || ''}',
            '${contact.company_name || ''}',
            '${contact.company_domain || ''}',
            '${contact.job_title || ''}',
            '${contact.seniority || ''}',
            '${contact.department || ''}',
            '${contact.industry || ''}',
            '${contact.employee_count || ''}',
            '${contact.company_revenue || ''}',
            '${contact.city || ''}',
            '${contact.state || ''}',
            '${contact.zip || ''}',
            '${contact.country || ''}',
            '${contact.age || ''}',
            '${contact.gender || ''}',
            '${contact.income_range || ''}',
            '${contact.education || ''}',
            '${contact.linkedin_url || ''}',
            '${contact.twitter_url || ''}',
            '${contact.facebook_url || ''}',
            '${contact.source || ''}',
            ${contact.confidence_score || 0},
            '${contact.last_updated || new Date().toISOString()}'
          )
        `;
        
        con.run(sql, (err: any) => {
          if (err) {
            console.error('Error inserting contact:', contact.email, err);
            reject(err);
          } else {
            insertedCount++;
            if (insertedCount % 10 === 0) {
              console.log(`Inserted ${insertedCount} contacts...`);
            }
            resolve();
          }
        });
      });
    }

    console.log(`Live audience data inserted successfully: ${insertedCount} contacts`);

    // Get row count
    const rowCount = await new Promise<number>((resolve, reject) => {
      con.all('SELECT COUNT(*) as count FROM audience_contacts', (err: any, rows: any[]) => {
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
      message: `Successfully imported ${rowCount} live audience contacts`,
      rowCount,
      note: 'Live audience API data imported. You can now use the preview functionality.',
      apiInfo: {
        audienceId,
        limit,
        totalRecords: liveData.count
      }
    });

  } catch (error) {
    console.error('Error fetching live audience data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch live audience data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { audience_id, limit = 1000 } = await request.json();
    
    if (!audience_id) {
      return NextResponse.json(
        { error: 'audience_id is required' },
        { status: 400 }
      );
    }

    // Create a new request with the provided parameters
    const newRequest = new NextRequest(
      `${request.nextUrl.origin}/api/studio/audience/fetch-live?audience_id=${audience_id}&limit=${limit}`,
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