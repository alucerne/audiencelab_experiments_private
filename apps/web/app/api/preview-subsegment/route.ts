import { NextRequest, NextResponse } from 'next/server';
import { buildWhereClause } from '../../home/[account]/studio/utils/buildWhereClause';
import { Storage } from '@google-cloud/storage';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import miscConfig from '~/config/misc.config';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: miscConfig.googleCloud.projectId,
  credentials: {
    client_email: miscConfig.googleCloud.clientEmail,
    private_key: miscConfig.googleCloud.privateKey,
  },
});

// Simple CSV parser for testing
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0]?.split(',') || [];
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    return row;
  });
  return rows;
}

// Simple filter function
function applyFilters(data: any[], filters: any[]): any[] {
  if (!filters || filters.length === 0) return data;
  
  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.field];
      const filterValue = filter.value;
      
      switch (filter.operator) {
        case 'equals':
          return value === filterValue;
        case 'contains':
          return value.toLowerCase().includes(filterValue.toLowerCase());
        case 'starts_with':
          return value.toLowerCase().startsWith(filterValue.toLowerCase());
        case 'ends_with':
          return value.toLowerCase().endsWith(filterValue.toLowerCase());
        default:
          return true;
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, audience_id, filters, page = 1, limit = 100 } = await request.json();

    if (!user_id || !audience_id) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    const offset = (page - 1) * limit;
    
    // For testing purposes, let's skip the database check and go straight to GCS
    // In production, this would check the audience table first
    console.log('Testing with audience ID:', audience_id);

    // Try to find the raw audience data in Google Storage
    // Based on the audience structure, try different possible locations
    const possibleBuckets = [
      'v3-audiencelab-enrichment-upload', // Enrichment bucket
      'v3-audiencelab-export-pixel', // Pixel export bucket
      'v3-audiencelab-audience-data', // Possible audience data bucket
      'v3-audiencelab-raw-data', // Possible raw data bucket
    ];
    
    const possiblePaths = [
      `${user_id}/${audience_id}.json`,
      `${user_id}/${audience_id}.csv`,
      `audiences/${user_id}/${audience_id}.json`,
      `audiences/${user_id}/${audience_id}.csv`,
      `audience-data/${user_id}/${audience_id}.json`,
      `audience-data/${user_id}/${audience_id}.csv`,
      `${audience_id}.json`,
      `${audience_id}.csv`,
    ];
    
    let rawData: any = null;
    let foundBucket = '';
    let foundPath = '';
    let dataFormat = 'unknown';
    
    // Try all combinations to find the raw audience data
    for (const bucketName of possibleBuckets) {
      for (const filePath of possiblePaths) {
        try {
          console.log(`Trying: gs://${bucketName}/${filePath}`);
          const bucket = storage.bucket(bucketName);
          const file = bucket.file(filePath);
          
          const [exists] = await file.exists();
          if (exists) {
            console.log(`Found raw audience data at: gs://${bucketName}/${filePath}`);
            const [fileContent] = await file.download();
            const contentText = fileContent.toString('utf-8');
            
            // Try to parse as JSON first, then CSV
            try {
              rawData = JSON.parse(contentText);
              dataFormat = 'json';
            } catch {
              // If not JSON, try CSV
              rawData = parseCSV(contentText);
              dataFormat = 'csv';
            }
            
            foundBucket = bucketName;
            foundPath = filePath;
            break;
          }
        } catch (error) {
          console.log(`Error checking gs://${bucketName}/${filePath}:`, error);
          continue;
        }
      }
      if (rawData) break;
    }
    
    // For testing purposes, use local test data when GCS data isn't found
    // Also use test data for mock audience IDs
    if (!rawData || audience_id.startsWith('studio-test-audience-')) {
      console.error('Raw audience data not found in any bucket, using local test data');
      
      // For testing purposes, use local test data when GCS data isn't found
      const testData = [
        { 
          domain: "perplexity.ai", 
          enrich_company: "Perplexity", 
          url: "https://linkedin.com/company/perplexity-ai",
          company_name: "Perplexity AI",
          company_domain: "perplexity.ai",
          industry: "Computer Software",
          job_title: "Software Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "51 to 100",
          company_revenue: "10 Million to 25 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 28,
          gender: "male",
          income_range: "$100,000 to $149,999",
          education: "Bachelor's Degree",
          homeowner: "Yes",
          married: "No"
        },
        { 
          domain: "databricks.com", 
          enrich_company: "Databricks", 
          url: "https://linkedin.com/company/databricks",
          company_name: "Databricks",
          company_domain: "databricks.com",
          industry: "Computer Software",
          job_title: "Data Scientist",
          seniority: "manager",
          department: "engineering",
          employee_count: "1001 to 5000",
          company_revenue: "500 Million to 1 Billion",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 32,
          gender: "female",
          income_range: "$150,000 to $199,999",
          education: "Master's Degree",
          homeowner: "Yes",
          married: "Yes"
        },
        { 
          domain: "openai.com", 
          enrich_company: "OpenAI", 
          url: "https://linkedin.com/company/openai",
          company_name: "OpenAI",
          company_domain: "openai.com",
          industry: "Computer Software",
          job_title: "Research Scientist",
          seniority: "staff",
          department: "research",
          employee_count: "501 to 1000",
          company_revenue: "100 Million to 250 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 29,
          gender: "male",
          income_range: "$200,000 to $249,999",
          education: "PhD",
          homeowner: "No",
          married: "No"
        },
        { 
          domain: "anthropic.com", 
          enrich_company: "Anthropic", 
          url: "https://linkedin.com/company/anthropic-ai",
          company_name: "Anthropic",
          company_domain: "anthropic.com",
          industry: "Computer Software",
          job_title: "AI Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "101 to 250",
          company_revenue: "50 Million to 100 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 31,
          gender: "male",
          income_range: "$150,000 to $199,999",
          education: "Master's Degree",
          homeowner: "Yes",
          married: "Yes"
        },
        { 
          domain: "cohere.ai", 
          enrich_company: "Cohere", 
          url: "https://linkedin.com/company/cohere-ai",
          company_name: "Cohere",
          company_domain: "cohere.ai",
          industry: "Computer Software",
          job_title: "Machine Learning Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "51 to 100",
          company_revenue: "25 Million to 50 Million",
          city: "Toronto",
          state: "ON",
          zip: "M5V 3A8",
          age: 27,
          gender: "female",
          income_range: "$100,000 to $149,999",
          education: "Bachelor's Degree",
          homeowner: "No",
          married: "No"
        },
        { 
          domain: "huggingface.co", 
          enrich_company: "Hugging Face", 
          url: "https://linkedin.com/company/huggingface",
          company_name: "Hugging Face",
          company_domain: "huggingface.co",
          industry: "Computer Software",
          job_title: "Software Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "101 to 250",
          company_revenue: "10 Million to 25 Million",
          city: "New York",
          state: "NY",
          zip: "10001",
          age: 26,
          gender: "male",
          income_range: "$75,000 to $99,999",
          education: "Bachelor's Degree",
          homeowner: "No",
          married: "No"
        },
        { 
          domain: "stability.ai", 
          enrich_company: "Stability AI", 
          url: "https://linkedin.com/company/stability-ai",
          company_name: "Stability AI",
          company_domain: "stability.ai",
          industry: "Computer Software",
          job_title: "AI Research Engineer",
          seniority: "staff",
          department: "research",
          employee_count: "51 to 100",
          company_revenue: "25 Million to 50 Million",
          city: "London",
          state: "UK",
          zip: "SW1A 1AA",
          age: 30,
          gender: "male",
          income_range: "$100,000 to $149,999",
          education: "Master's Degree",
          homeowner: "No",
          married: "Yes"
        },
        { 
          domain: "midjourney.com", 
          enrich_company: "Midjourney", 
          url: "https://linkedin.com/company/midjourney",
          company_name: "Midjourney",
          company_domain: "midjourney.com",
          industry: "Computer Software",
          job_title: "Product Manager",
          seniority: "manager",
          department: "product management",
          employee_count: "11 to 25",
          company_revenue: "5 Million to 10 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 33,
          gender: "female",
          income_range: "$150,000 to $199,999",
          education: "MBA",
          homeowner: "Yes",
          married: "Yes"
        },
        { 
          domain: "runwayml.com", 
          enrich_company: "Runway", 
          url: "https://linkedin.com/company/runwayml",
          company_name: "Runway",
          company_domain: "runwayml.com",
          industry: "Computer Software",
          job_title: "Frontend Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "26 to 50",
          company_revenue: "10 Million to 25 Million",
          city: "New York",
          state: "NY",
          zip: "10001",
          age: 25,
          gender: "male",
          income_range: "$75,000 to $99,999",
          education: "Bachelor's Degree",
          homeowner: "No",
          married: "No"
        },
        { 
          domain: "replicate.com", 
          enrich_company: "Replicate", 
          url: "https://linkedin.com/company/replicate-ai",
          company_name: "Replicate",
          company_domain: "replicate.com",
          industry: "Computer Software",
          job_title: "DevOps Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "11 to 25",
          company_revenue: "5 Million to 10 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 28,
          gender: "male",
          income_range: "$100,000 to $149,999",
          education: "Bachelor's Degree",
          homeowner: "No",
          married: "No"
        }
      ];
      
      rawData = testData;
      dataFormat = 'json';
      foundBucket = 'local-test';
      foundPath = 'test-data';
    }

    console.log(`Successfully loaded ${dataFormat.toUpperCase()} data, records:`, Array.isArray(rawData) ? rawData.length : 'object');

    // Convert data to array format if needed
    let allData: any[] = [];
    if (Array.isArray(rawData)) {
      allData = rawData;
    } else if (rawData && typeof rawData === 'object') {
      // If it's an object, try to extract the data array
      if (rawData.data && Array.isArray(rawData.data)) {
        allData = rawData.data;
      } else if (rawData.records && Array.isArray(rawData.records)) {
        allData = rawData.records;
      } else if (rawData.audience && Array.isArray(rawData.audience)) {
        allData = rawData.audience;
      } else {
        // If it's a single record object, wrap it in an array
        allData = [rawData];
      }
    }

    console.log('Total records loaded:', allData.length);

    // Apply filters
    const filteredData = applyFilters(allData, filters);
    console.log('Filtered records:', filteredData.length);

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit);
    console.log('Paginated records:', paginatedData.length);

    return NextResponse.json({ 
      rows: paginatedData,
      total: filteredData.length,
      page,
      limit,
      source: 'gcs',
      dataFormat,
      bucket: foundBucket,
      filePath: foundPath,
      audienceName: 'Test Audience'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 