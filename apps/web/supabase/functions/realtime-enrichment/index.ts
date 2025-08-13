// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Types for enrichment
interface EnrichmentRequest {
  email?: string;
  domain?: string;
  company_name?: string;
  enrich: string[];
}

interface EnrichmentResponse {
  // Personal Fields
  first_name?: string;
  last_name?: string;
  business_email?: string;
  personal_email?: string;
  age?: string;
  age_range?: string;
  gender?: string;
  children?: string;
  education?: string;
  education_history?: string;
  
  // Business Fields
  company_name?: string;
  company_domain?: string;
  industry?: string;
  job_title?: string;
  seniority?: string;
  department?: string;
  employee_count?: string;
  company_revenue?: string;
  company_address?: string;
  company_phone?: string;
  company_linkedin_url?: string;
  headline?: string;
  years_experience?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  skills?: string;
  interests?: string;
  
  // Contact Fields
  mobile_phone?: string;
  direct_number?: string;
  personal_phone?: string;
  deep_verified_emails?: string;
  
  // Location Fields
  city?: string;
  state?: string;
  zip?: string;
  personal_address?: string;
  personal_city?: string;
  personal_state?: string;
  personal_zip?: string;
  
  // Financial Fields
  income_range?: string;
  net_worth?: string;
  
  // Family Fields
  homeowner?: string;
  married?: string;
  
  // SkipTrace Fields
  skiptrace_address?: string;
  skiptrace_b2b_address?: string;
  skiptrace_b2b_phone?: string;
  skiptrace_b2b_source?: string;
  skiptrace_b2b_website?: string;
  skiptrace_city?: string;
  skiptrace_credit_rating?: string;
  skiptrace_dnc?: string;
  skiptrace_ethnic_code?: string;
  skiptrace_exact_age?: string;
  skiptrace_ip?: string;
  skiptrace_landline_numbers?: string;
  skiptrace_language_code?: string;
  skiptrace_match_score?: string;
  skiptrace_name?: string;
  skiptrace_state?: string;
  skiptrace_wireless_numbers?: string;
  skiptrace_zip?: string;
  
  // Other Fields
  uuid?: string;
  valid_phones?: string;
  social_connections?: string;
  
  // Error field
  error?: string;
}

// Mock enrichment function for fallback
function generateMockEnrichment(request: EnrichmentRequest): EnrichmentResponse {
  console.log('generateMockEnrichment called with request:', request);
  
  const enrichment: EnrichmentResponse = {};
  
  // Generate more realistic mock data based on input identifiers
  const domain = request.domain || 'example.com';
  const email = request.email || 'user@example.com';
  const companyName = request.company_name || 'Example Corp';
  
  console.log('Mock enrichment identifiers:', { domain, email, companyName });
  
  // Extract domain name for more realistic data
  const domainName = domain.replace(/^www\./, '').split('.')[0] || 'example';
  const emailName = email.split('@')[0] || 'user';
  
  // Generate varied data based on identifiers
  const mockNames = [
    { first: 'John', last: 'Doe' },
    { first: 'Jane', last: 'Smith' },
    { first: 'Mike', last: 'Johnson' },
    { first: 'Sarah', last: 'Williams' },
    { first: 'David', last: 'Brown' },
    { first: 'Lisa', last: 'Davis' },
    { first: 'Robert', last: 'Miller' },
    { first: 'Emily', last: 'Wilson' },
    { first: 'James', last: 'Taylor' },
    { first: 'Amanda', last: 'Anderson' }
  ];
  
  // Select a name based on domain/email hash for consistency
  const nameIndex = Math.abs(domainName.charCodeAt(0) + emailName.charCodeAt(0)) % mockNames.length;
  const selectedName = mockNames[nameIndex] || mockNames[0];
  
  console.log('Selected mock name:', selectedName, 'from index:', nameIndex);
  
  // Pre-define arrays to avoid variable hoisting issues
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail'];
  const titles = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Marketing Manager', 'Sales Director', 'Designer'];
  const seniorities = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Manager', 'Director'];
  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Design', 'Operations'];
  const employeeRanges = ['1-10', '10-50', '50-200', '200-1000', '1000+'];
  const revenues = ['$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '$500M+'];
  const skillSets = [
    'React, Node.js, Python, AWS',
    'JavaScript, TypeScript, React, Node.js',
    'Python, Data Science, Machine Learning',
    'Marketing, SEO, Social Media, Analytics',
    'Sales, CRM, Lead Generation, Negotiation',
    'UI/UX Design, Figma, Adobe Creative Suite'
  ];
  const interests = [
    'Technology, Travel, Reading',
    'Sports, Music, Photography',
    'Cooking, Gardening, Hiking',
    'Art, Movies, Literature',
    'Fitness, Nutrition, Wellness',
    'Gaming, Anime, Technology'
  ];

  console.log('Processing enrichment for fields:', request.enrich);

  // Generate mock data based on requested fields
  request.enrich.forEach(field => {
    console.log(`Processing field: ${field}`);
    switch (field) {
      // Personal Fields
      case 'first_name':
        enrichment.first_name = selectedName?.first || 'John';
        console.log(`Set first_name to: ${enrichment.first_name}`);
        break;
      case 'last_name':
        enrichment.last_name = selectedName?.last || 'Doe';
        console.log(`Set last_name to: ${enrichment.last_name}`);
        break;
      case 'business_email':
        enrichment.business_email = request.email || `${selectedName?.first?.toLowerCase() || 'john'}.${selectedName?.last?.toLowerCase() || 'doe'}@${domain}`;
        console.log(`Set business_email to: ${enrichment.business_email}`);
        break;
      case 'personal_email':
        enrichment.personal_email = `${selectedName?.first?.toLowerCase() || 'john'}.${selectedName?.last?.toLowerCase() || 'doe'}@gmail.com`;
        console.log(`Set personal_email to: ${enrichment.personal_email}`);
        break;
      case 'age':
        enrichment.age = String(25 + (nameIndex * 3) % 40); // Varied ages
        console.log(`Set age to: ${enrichment.age}`);
        break;
      case 'age_range':
        const age = 25 + (nameIndex * 3) % 40;
        if (age < 30) enrichment.age_range = '25-30';
        else if (age < 35) enrichment.age_range = '30-35';
        else if (age < 40) enrichment.age_range = '35-40';
        else enrichment.age_range = '40-45';
        console.log(`Set age_range to: ${enrichment.age_range}`);
        break;
      case 'gender':
        enrichment.gender = nameIndex % 2 === 0 ? 'Male' : 'Female';
        console.log(`Set gender to: ${enrichment.gender}`);
        break;
      case 'children':
        enrichment.children = String(nameIndex % 4);
        console.log(`Set children to: ${enrichment.children}`);
        break;
      case 'education':
        enrichment.education = 'Bachelor\'s Degree';
        console.log(`Set education to: ${enrichment.education}`);
        break;
      case 'education_history':
        enrichment.education_history = 'University of Technology';
        console.log(`Set education_history to: ${enrichment.education_history}`);
        break;
      
      // Business Fields
      case 'company_name':
        enrichment.company_name = companyName;
        console.log(`Set company_name to: ${enrichment.company_name}`);
        break;
      case 'company_domain':
        enrichment.company_domain = domain;
        console.log(`Set company_domain to: ${enrichment.company_domain}`);
        break;
      case 'industry':
        enrichment.industry = industries[nameIndex % industries.length];
        console.log(`Set industry to: ${enrichment.industry}`);
        break;
      case 'job_title':
        enrichment.job_title = titles[nameIndex % titles.length];
        console.log(`Set job_title to: ${enrichment.job_title}`);
        break;
      case 'seniority':
        enrichment.seniority = seniorities[nameIndex % seniorities.length];
        console.log(`Set seniority to: ${enrichment.seniority}`);
        break;
      case 'department':
        enrichment.department = departments[nameIndex % departments.length];
        console.log(`Set department to: ${enrichment.department}`);
        break;
      case 'employee_count':
        enrichment.employee_count = employeeRanges[nameIndex % employeeRanges.length];
        console.log(`Set employee_count to: ${enrichment.employee_count}`);
        break;
      case 'company_revenue':
        enrichment.company_revenue = revenues[nameIndex % revenues.length];
        console.log(`Set company_revenue to: ${enrichment.company_revenue}`);
        break;
      case 'company_address':
        enrichment.company_address = `${100 + nameIndex} Business St, San Francisco, CA`;
        console.log(`Set company_address to: ${enrichment.company_address}`);
        break;
      case 'company_phone':
        enrichment.company_phone = `+1-555-${String(1000 + nameIndex).padStart(4, '0')}`;
        console.log(`Set company_phone to: ${enrichment.company_phone}`);
        break;
      case 'company_linkedin_url':
        enrichment.company_linkedin_url = `https://linkedin.com/company/${domainName}`;
        console.log(`Set company_linkedin_url to: ${enrichment.company_linkedin_url}`);
        break;
      case 'headline':
        enrichment.headline = `${titles[nameIndex % titles.length]} at ${companyName}`;
        console.log(`Set headline to: ${enrichment.headline}`);
        break;
      case 'years_experience':
        enrichment.years_experience = String(2 + (nameIndex * 2) % 15);
        console.log(`Set years_experience to: ${enrichment.years_experience}`);
        break;
      case 'linkedin_url':
        enrichment.linkedin_url = `https://linkedin.com/in/${selectedName?.first?.toLowerCase() || 'john'}-${selectedName?.last?.toLowerCase() || 'doe'}`;
        console.log(`Set linkedin_url to: ${enrichment.linkedin_url}`);
        break;
      case 'twitter_url':
        enrichment.twitter_url = `https://twitter.com/${selectedName?.first?.toLowerCase() || 'john'}${selectedName?.last?.toLowerCase() || 'doe'}`;
        console.log(`Set twitter_url to: ${enrichment.twitter_url}`);
        break;
      case 'facebook_url':
        enrichment.facebook_url = `https://facebook.com/${selectedName?.first?.toLowerCase() || 'john'}.${selectedName?.last?.toLowerCase() || 'doe'}`;
        console.log(`Set facebook_url to: ${enrichment.facebook_url}`);
        break;
      case 'skills':
        enrichment.skills = skillSets[nameIndex % skillSets.length];
        console.log(`Set skills to: ${enrichment.skills}`);
        break;
      case 'interests':
        enrichment.interests = interests[nameIndex % interests.length];
        console.log(`Set interests to: ${enrichment.interests}`);
        break;
      
      // Contact Fields
      case 'mobile_phone':
        enrichment.mobile_phone = '+1-555-0124';
        console.log(`Set mobile_phone to: ${enrichment.mobile_phone}`);
        break;
      case 'direct_number':
        enrichment.direct_number = '+1-555-0125';
        console.log(`Set direct_number to: ${enrichment.direct_number}`);
        break;
      case 'personal_phone':
        enrichment.personal_phone = '+1-555-0126';
        console.log(`Set personal_phone to: ${enrichment.personal_phone}`);
        break;
      case 'deep_verified_emails':
        enrichment.deep_verified_emails = 'john.doe@personal.com, john.doe@company.com';
        console.log(`Set deep_verified_emails to: ${enrichment.deep_verified_emails}`);
        break;
      
      // Location Fields
      case 'city':
        enrichment.city = 'San Francisco';
        console.log(`Set city to: ${enrichment.city}`);
        break;
      case 'state':
        enrichment.state = 'CA';
        console.log(`Set state to: ${enrichment.state}`);
        break;
      case 'zip':
        enrichment.zip = '94105';
        console.log(`Set zip to: ${enrichment.zip}`);
        break;
      case 'personal_address':
        enrichment.personal_address = '456 Home Ave, San Francisco, CA';
        console.log(`Set personal_address to: ${enrichment.personal_address}`);
        break;
      case 'personal_city':
        enrichment.personal_city = 'San Francisco';
        console.log(`Set personal_city to: ${enrichment.personal_city}`);
        break;
      case 'personal_state':
        enrichment.personal_state = 'CA';
        console.log(`Set personal_state to: ${enrichment.personal_state}`);
        break;
      case 'personal_zip':
        enrichment.personal_zip = '94110';
        console.log(`Set personal_zip to: ${enrichment.personal_zip}`);
        break;
      
      // Financial Fields
      case 'income_range':
        enrichment.income_range = '$75K - $100K';
        console.log(`Set income_range to: ${enrichment.income_range}`);
        break;
      case 'net_worth':
        enrichment.net_worth = '$250K - $500K';
        console.log(`Set net_worth to: ${enrichment.net_worth}`);
        break;
      
      // Family Fields
      case 'homeowner':
        enrichment.homeowner = 'Yes';
        console.log(`Set homeowner to: ${enrichment.homeowner}`);
        break;
      case 'married':
        enrichment.married = 'Yes';
        console.log(`Set married to: ${enrichment.married}`);
        break;
      
      // SkipTrace Fields
      case 'skiptrace_address':
        enrichment.skiptrace_address = '456 Home Ave, San Francisco, CA 94110';
        console.log(`Set skiptrace_address to: ${enrichment.skiptrace_address}`);
        break;
      case 'skiptrace_b2b_address':
        enrichment.skiptrace_b2b_address = '123 Business St, San Francisco, CA 94105';
        console.log(`Set skiptrace_b2b_address to: ${enrichment.skiptrace_b2b_address}`);
        break;
      case 'skiptrace_b2b_phone':
        enrichment.skiptrace_b2b_phone = '+1-555-0123';
        console.log(`Set skiptrace_b2b_phone to: ${enrichment.skiptrace_b2b_phone}`);
        break;
      case 'skiptrace_b2b_source':
        enrichment.skiptrace_b2b_source = 'Company Website';
        console.log(`Set skiptrace_b2b_source to: ${enrichment.skiptrace_b2b_source}`);
        break;
      case 'skiptrace_b2b_website':
        enrichment.skiptrace_b2b_website = 'https://example.com';
        console.log(`Set skiptrace_b2b_website to: ${enrichment.skiptrace_b2b_website}`);
        break;
      case 'skiptrace_city':
        enrichment.skiptrace_city = 'San Francisco';
        console.log(`Set skiptrace_city to: ${enrichment.skiptrace_city}`);
        break;
      case 'skiptrace_credit_rating':
        enrichment.skiptrace_credit_rating = 'Excellent';
        console.log(`Set skiptrace_credit_rating to: ${enrichment.skiptrace_credit_rating}`);
        break;
      case 'skiptrace_dnc':
        enrichment.skiptrace_dnc = 'No';
        console.log(`Set skiptrace_dnc to: ${enrichment.skiptrace_dnc}`);
        break;
      case 'skiptrace_ethnic_code':
        enrichment.skiptrace_ethnic_code = 'Caucasian';
        console.log(`Set skiptrace_ethnic_code to: ${enrichment.skiptrace_ethnic_code}`);
        break;
      case 'skiptrace_exact_age':
        enrichment.skiptrace_exact_age = '32';
        console.log(`Set skiptrace_exact_age to: ${enrichment.skiptrace_exact_age}`);
        break;
      case 'skiptrace_ip':
        enrichment.skiptrace_ip = '192.168.1.100';
        console.log(`Set skiptrace_ip to: ${enrichment.skiptrace_ip}`);
        break;
      case 'skiptrace_landline_numbers':
        enrichment.skiptrace_landline_numbers = '+1-555-0127';
        console.log(`Set skiptrace_landline_numbers to: ${enrichment.skiptrace_landline_numbers}`);
        break;
      case 'skiptrace_language_code':
        enrichment.skiptrace_language_code = 'EN';
        console.log(`Set skiptrace_language_code to: ${enrichment.skiptrace_language_code}`);
        break;
      case 'skiptrace_match_score':
        enrichment.skiptrace_match_score = '95';
        console.log(`Set skiptrace_match_score to: ${enrichment.skiptrace_match_score}`);
        break;
      case 'skiptrace_name':
        enrichment.skiptrace_name = 'John Doe';
        console.log(`Set skiptrace_name to: ${enrichment.skiptrace_name}`);
        break;
      case 'skiptrace_state':
        enrichment.skiptrace_state = 'CA';
        console.log(`Set skiptrace_state to: ${enrichment.skiptrace_state}`);
        break;
      case 'skiptrace_wireless_numbers':
        enrichment.skiptrace_wireless_numbers = '+1-555-0124';
        console.log(`Set skiptrace_wireless_numbers to: ${enrichment.skiptrace_wireless_numbers}`);
        break;
      case 'skiptrace_zip':
        enrichment.skiptrace_zip = '94110';
        console.log(`Set skiptrace_zip to: ${enrichment.skiptrace_zip}`);
        break;
      
      // Other Fields
      case 'uuid':
        enrichment.uuid = '123e4567-e89b-12d3-a456-426614174000';
        console.log(`Set uuid to: ${enrichment.uuid}`);
        break;
      case 'valid_phones':
        enrichment.valid_phones = '+1-555-0124, +1-555-0125';
        console.log(`Set valid_phones to: ${enrichment.valid_phones}`);
        break;
      case 'social_connections':
        enrichment.social_connections = 'LinkedIn, Twitter, Facebook';
        console.log(`Set social_connections to: ${enrichment.social_connections}`);
        break;
    }
  });
  
  console.log('Final enrichment object:', enrichment);
  return enrichment;
}

// Main Edge Function handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Parse request body
    const body: EnrichmentRequest = await req.json();
    
    console.log('Edge Function: Enrichment request received:', {
      email: body.email,
      domain: body.domain,
      company_name: body.company_name,
      enrich: body.enrich
    });

    // Validate request
    if (!body.enrich || body.enrich.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No enrichment fields specified',
          details: 'Please select at least one field to enrich'
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Validate that we have at least one identifier
    const hasEmail = body.email && body.email.trim() !== '';
    const hasDomain = body.domain && body.domain.trim() !== '';
    const hasCompanyName = body.company_name && body.company_name.trim() !== '';
    
    if (!hasEmail && !hasDomain && !hasCompanyName) {
      return new Response(
        JSON.stringify({ 
          error: 'At least one identifier (email, domain, or company_name) is required',
          details: 'Please ensure your data contains at least one of these fields for enrichment',
          providedIdentifiers: {
            email: body.email,
            domain: body.domain,
            company_name: body.company_name
          }
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log('Edge Function: Request validated successfully');

    // Generate enrichment data
    const enrichmentData = generateMockEnrichment(body);

    console.log('Edge Function: Enrichment completed successfully');

    return new Response(
      JSON.stringify(enrichmentData),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Edge Function: Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/realtime-enrichment' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"domain": "example.com", "enrich": ["first_name", "last_name"]}'

*/
