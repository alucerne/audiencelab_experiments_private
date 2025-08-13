import { NextRequest, NextResponse } from 'next/server';
import { buildWhereClause } from '../../home/[account]/studio/utils/buildWhereClause';
import { Storage } from '@google-cloud/storage';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import miscConfig from '~/config/misc.config';
import fs from 'fs';
import path from 'path';

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

// Load test contacts data
function loadTestContactsData(): any[] {
  try {
    // Try multiple possible paths for the test data file
    const possiblePaths = [
      path.join(process.cwd(), 'apps', 'web', 'public', 'test_contacts_data_fixed.json'),
      path.join(process.cwd(), 'public', 'test_contacts_data_fixed.json'),
      path.join(process.cwd(), 'apps', 'web', 'public', 'test_contacts_data.json'),
      path.join(process.cwd(), 'public', 'test_contacts_data.json'),
      path.join(process.cwd(), 'al_v3_localdev', 'test_contacts_data.json'),
      path.join(process.cwd(), 'test_contacts_data.json'),
      path.join(process.cwd(), '..', 'test_contacts_data.json'),
      path.join(process.cwd(), '..', 'al_v3_localdev', 'test_contacts_data.json'),
    ];
    
    let fileContent = '';
    let foundPath = '';
    
    for (const testDataPath of possiblePaths) {
      try {
        console.log('Trying to load test data from:', testDataPath);
        if (fs.existsSync(testDataPath)) {
          fileContent = fs.readFileSync(testDataPath, 'utf-8');
          foundPath = testDataPath;
          console.log('Successfully loaded test data from:', foundPath);
          break;
        }
      } catch (error) {
        console.log('Failed to load from:', testDataPath, error);
        continue;
      }
    }
    
    if (!fileContent) {
      console.error('Could not find test contacts data file in any of the expected locations');
      return [];
    }
    
    const data = JSON.parse(fileContent);
    
    // Transform the data to match the expected format
    return data.map((contact: any) => ({
      // Map the test contact fields to studio-expected fields
      domain: contact.COMPANY_DOMAIN || '',
      enrich_company: contact.COMPANY_NAME || '',
      url: contact.COMPANY_LINKEDIN_URL ? `https://${contact.COMPANY_LINKEDIN_URL}` : '',
      company_name: contact.COMPANY_NAME || '',
      company_domain: contact.COMPANY_DOMAIN || '',
      industry: contact.COMPANY_INDUSTRY || '',
      job_title: contact.JOB_TITLE || '',
      seniority: contact.SENIORITY_LEVEL?.toLowerCase() || '',
      department: contact.DEPARTMENT || '',
      employee_count: contact.COMPANY_EMPLOYEE_COUNT || '',
      company_revenue: contact.COMPANY_REVENUE || '',
      city: contact.COMPANY_CITY || '',
      state: contact.COMPANY_STATE || '',
      zip: contact.COMPANY_ZIP || '',
      age: contact.AGE_RANGE || '',
      gender: contact.GENDER || '',
      income_range: contact.INCOME_RANGE || '',
      education: contact.EDUCATION_HISTORY ? 'Bachelor\'s Degree' : '',
      homeowner: contact.HOMEOWNER || '',
      married: contact.MARRIED || '',
      // Additional fields from test data
      first_name: contact.FIRST_NAME || '',
      last_name: contact.LAST_NAME || '',
      business_email: contact.BUSINESS_EMAIL || '',
      personal_email: contact.PERSONAL_EMAILS || '',
      mobile_phone: contact.MOBILE_PHONE || '',
      company_address: contact.COMPANY_ADDRESS || '',
      company_description: contact.COMPANY_DESCRIPTION || '',
      company_phone: contact.COMPANY_PHONE || '',
      headline: contact.HEADLINE || '',
      years_experience: contact.INFERRED_YEARS_EXPERIENCE || '',
      company_name_history: contact.COMPANY_NAME_HISTORY || '',
      job_title_history: contact.JOB_TITLE_HISTORY || '',
      education_history: contact.EDUCATION_HISTORY || '',
      // UUID for unique identification
      uuid: contact.UUID || '',
      // Additional contact fields
      direct_number: contact.DIRECT_NUMBER || '',
      direct_number_dnc: contact.DIRECT_NUMBER_DNC || '',
      mobile_phone_dnc: contact.MOBILE_PHONE_DNC || '',
      personal_phone: contact.PERSONAL_PHONE || '',
      personal_phone_dnc: contact.PERSONAL_PHONE_DNC || '',
      deep_verified_emails: contact.DEEP_VERIFIED_EMAILS || '',
      sha256_personal_email: contact.SHA256_PERSONAL_EMAIL || '',
      sha256_business_email: contact.SHA256_BUSINESS_EMAIL || '',
      // Personal address fields
      personal_address: contact.PERSONAL_ADDRESS || '',
      personal_city: contact.PERSONAL_CITY || '',
      personal_state: contact.PERSONAL_STATE || '',
      personal_zip: contact.PERSONAL_ZIP || '',
      // Company location fields
      company_linkedin_url: contact.COMPANY_LINKEDIN_URL || '',
      // Additional fields from test contacts data
      age_range: contact.AGE_RANGE || '',
      children: contact.CHILDREN || '',
      net_worth: contact.NET_WORTH || '',
      personal_zip4: contact.PERSONAL_ZIP4 || '',
      company_sic: contact.COMPANY_SIC || '',
      company_naics: contact.COMPANY_NAICS || '',
      linkedin_url: contact.LINKEDIN_URL || '',
      twitter_url: contact.TWITTER_URL || '',
      facebook_url: contact.FACEBOOK_URL || '',
      social_connections: contact.SOCIAL_CONNECTIONS || '',
      skills: contact.SKILLS || '',
      interests: contact.INTERESTS || '',
      valid_phones: contact.VALID_PHONES || '',
      // SkipTrace fields
      skiptrace_match_score: contact.SKIPTRACE_MATCH_SCORE || '',
      skiptrace_name: contact.SKIPTRACE_NAME || '',
      skiptrace_address: contact.SKIPTRACE_ADDRESS || '',
      skiptrace_city: contact.SKIPTRACE_CITY || '',
      skiptrace_state: contact.SKIPTRACE_STATE || '',
      skiptrace_zip: contact.SKIPTRACE_ZIP || '',
      skiptrace_landline_numbers: contact.SKIPTRACE_LANDLINE_NUMBERS || '',
      skiptrace_wireless_numbers: contact.SKIPTRACE_WIRELESS_NUMBERS || '',
      skiptrace_credit_rating: contact.SKIPTRACE_CREDIT_RATING || '',
      skiptrace_dnc: contact.SKIPTRACE_DNC || '',
      skiptrace_exact_age: contact.SKIPTRACE_EXACT_AGE || '',
      skiptrace_ethnic_code: contact.SKIPTRACE_ETHNIC_CODE || '',
      skiptrace_language_code: contact.SKIPTRACE_LANGUAGE_CODE || '',
      skiptrace_ip: contact.SKIPTRACE_IP || '',
      skiptrace_b2b_address: contact.SKIPTRACE_B2B_ADDRESS || '',
      skiptrace_b2b_phone: contact.SKIPTRACE_B2B_PHONE || '',
      skiptrace_b2b_source: contact.SKIPTRACE_B2B_SOURCE || '',
      skiptrace_b2b_website: contact.SKIPTRACE_B2B_WEBSITE || '',
    }));
  } catch (error) {
    console.error('Error loading test contacts data:', error);
    return [];
  }
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
          return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
        case 'does_not_contain':
          return !value || !value.toString().toLowerCase().includes(filterValue.toLowerCase());
        case 'starts_with':
          return value && value.toString().toLowerCase().startsWith(filterValue.toLowerCase());
        case 'ends_with':
          return value && value.toString().toLowerCase().endsWith(filterValue.toLowerCase());
        case 'exists':
          return value !== null && value !== undefined && value !== '';
        case 'greater_than':
          return value && parseFloat(value) > parseFloat(filterValue);
        case 'less_than':
          return value && parseFloat(value) < parseFloat(filterValue);
        case 'in':
          const values = filterValue.split(',').map((v: string) => v.trim().toLowerCase());
          return value && values.includes(value.toString().toLowerCase());
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
    
    console.log('Testing with audience ID:', audience_id);

    // Check if this is a test audience that should use test contacts data
    if (audience_id === 'test-contacts-audience') {
      console.log('Loading test contacts data for audience:', audience_id);
      
      const testData = loadTestContactsData();
      
      if (testData.length === 0) {
        return NextResponse.json({ 
          error: 'Test contacts data not found',
          details: 'The test contacts data file could not be loaded'
        }, { status: 404 });
      }

      console.log('Loaded test contacts data:', testData.length, 'records');

      // Apply filters
      const filteredData = applyFilters(testData, filters);
      console.log('Filtered test contacts:', filteredData.length);

      // Apply pagination
      const paginatedData = filteredData.slice(offset, offset + limit);
      console.log('Paginated test contacts:', paginatedData.length);

      return NextResponse.json({ 
        rows: paginatedData,
        total: filteredData.length,
        page,
        limit,
        source: 'test-contacts',
        dataFormat: 'json',
        bucket: 'local-test-data',
        filePath: 'al_v3_localdev/test_contacts_data.json',
        audienceName: 'Test Contacts Audience'
      });
    }

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
          seniority: "senior",
          department: "research",
          employee_count: "501 to 1000",
          company_revenue: "100 Million to 500 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 35,
          gender: "male",
          income_range: "$200,000 to $299,999",
          education: "PhD",
          homeowner: "Yes",
          married: "Yes"
        },
        { 
          domain: "anthropic.com", 
          enrich_company: "Anthropic", 
          url: "https://linkedin.com/company/anthropic",
          company_name: "Anthropic",
          company_domain: "anthropic.com",
          industry: "Computer Software",
          job_title: "Machine Learning Engineer",
          seniority: "staff",
          department: "engineering",
          employee_count: "101 to 500",
          company_revenue: "50 Million to 100 Million",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          age: 30,
          gender: "female",
          income_range: "$150,000 to $199,999",
          education: "Master's Degree",
          homeowner: "No",
          married: "No"
        },
        { 
          domain: "cohere.ai", 
          enrich_company: "Cohere", 
          url: "https://linkedin.com/company/cohere-ai",
          company_name: "Cohere",
          company_domain: "cohere.ai",
          industry: "Computer Software",
          job_title: "Product Manager",
          seniority: "manager",
          department: "product",
          employee_count: "51 to 100",
          company_revenue: "10 Million to 25 Million",
          city: "Toronto",
          state: "ON",
          zip: "M5V 3A8",
          age: 29,
          gender: "male",
          income_range: "$100,000 to $149,999",
          education: "Bachelor's Degree",
          homeowner: "No",
          married: "No"
        }
      ];
      
      rawData = testData;
      dataFormat = 'json';
      foundBucket = 'local-test-data';
      foundPath = 'mock-data';
    }

    // Process the raw data
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