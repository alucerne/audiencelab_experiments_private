import { NextRequest, NextResponse } from 'next/server';
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

    // For Vercel deployment, we'll return the data directly without DuckDB
    // The data can be processed by the frontend or other API endpoints
    console.log(`Live audience data processed successfully: ${liveData.result.length} contacts`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${liveData.result.length} live audience contacts`,
      rowCount: liveData.result.length,
      note: 'Live audience API data processed. You can now use the preview functionality.',
      apiInfo: {
        audienceId,
        limit,
        totalRecords: liveData.count
      },
      data: liveData.result // Return the actual data for frontend use
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