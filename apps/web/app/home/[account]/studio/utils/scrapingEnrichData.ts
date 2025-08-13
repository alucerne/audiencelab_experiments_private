// utils/scrapingEnrichData.ts
import { EnrichFieldKey } from './enrichmentOptions';
import miscConfig from '~/config/misc.config';

// Simplified interfaces for fallback implementation
export interface ScrapingEnrichmentRequest {
  email?: string;
  domain?: string;
  company_name?: string;
  enrich: EnrichFieldKey[];
  customFields?: string[];
}

export interface ScrapingEnrichmentResponse {
  // Discovery Fields
  company_name?: string;
  company_domain?: string;
  website?: string;
  business_type?: string;
  description?: string;
  
  // Profile Fields
  industry?: string;
  sub_category?: string;
  business_model?: string;
  market_segment?: string;
  headquarters?: string;
  year_founded?: string;
  company_type?: string;
  mission?: string;
  vision?: string;
  
  // Funding Fields
  funding_stage?: string;
  total_raised?: string;
  last_round_amount?: string;
  last_round_date?: string;
  investors?: string[];
  valuation?: string;
  revenue?: string;
  growth_rate?: string;
  
  // Tech Stack Fields
  programming_languages?: string[];
  frameworks?: string[];
  databases?: string[];
  cloud_providers?: string[];
  tools?: string[];
  infrastructure?: string[];
  integrations?: string[];
  
  // Custom Fields (dynamic)
  [key: string]: any;
  
  // Metadata
  sources?: string[];
  confidence?: number;
  error?: string;
}

// Field mapping from existing enrichment system to scraping agent fields
const FIELD_MAPPING: Record<EnrichFieldKey, string> = {
  // Map existing enrichment fields to scraping agent fields
  'company_name': 'company_name',
  'company_domain': 'company_domain',
  'industry': 'industry',
  'job_title': 'job_title', // Not available in scraping, will be skipped
  'seniority': 'seniority', // Not available in scraping, will be skipped
  'department': 'department', // Not available in scraping, will be skipped
  'employee_count': 'employee_count', // Will be mapped to custom field
  'company_revenue': 'revenue',
  'company_address': 'headquarters',
  'company_phone': 'company_phone', // Will be mapped to custom field
  'company_linkedin_url': 'company_linkedin_url', // Will be mapped to custom field
  'headline': 'headline', // Not available in scraping, will be skipped
  'years_experience': 'years_experience', // Not available in scraping, will be skipped
  'linkedin_url': 'linkedin_url', // Will be mapped to custom field
  'twitter_url': 'twitter_url', // Will be mapped to custom field
  'facebook_url': 'facebook_url', // Will be mapped to custom field
  'skills': 'skills', // Not available in scraping, will be skipped
  'interests': 'interests', // Not available in scraping, will be skipped
  
  // Personal fields (not available in scraping)
  'first_name': 'first_name',
  'last_name': 'last_name',
  'business_email': 'business_email',
  'personal_email': 'personal_email',
  'age': 'age',
  'age_range': 'age_range',
  'gender': 'gender',
  'children': 'children',
  'education': 'education',
  'education_history': 'education_history',
  
  // Contact fields (not available in scraping)
  'mobile_phone': 'mobile_phone',
  'direct_number': 'direct_number',
  'personal_phone': 'personal_phone',
  'deep_verified_emails': 'deep_verified_emails',
  
  // Location fields (not available in scraping)
  'city': 'city',
  'state': 'state',
  'zip': 'zip',
  'personal_address': 'personal_address',
  'personal_city': 'personal_city',
  'personal_state': 'personal_state',
  'personal_zip': 'personal_zip',
  
  // Financial fields (not available in scraping)
  'income_range': 'income_range',
  'net_worth': 'net_worth',
  
  // Family fields (not available in scraping)
  'homeowner': 'homeowner',
  'married': 'married',
  
  // SkipTrace fields (not available in scraping)
  'skiptrace_address': 'skiptrace_address',
  'skiptrace_b2b_address': 'skiptrace_b2b_address',
  'skiptrace_b2b_phone': 'skiptrace_b2b_phone',
  'skiptrace_b2b_source': 'skiptrace_b2b_source',
  'skiptrace_b2b_website': 'skiptrace_b2b_website',
  'skiptrace_city': 'skiptrace_city',
  'skiptrace_credit_rating': 'skiptrace_credit_rating',
  'skiptrace_dnc': 'skiptrace_dnc',
  'skiptrace_ethnic_code': 'skiptrace_ethnic_code',
  'skiptrace_exact_age': 'skiptrace_exact_age',
  'skiptrace_ip': 'skiptrace_ip',
  'skiptrace_landline_numbers': 'skiptrace_landline_numbers',
  'skiptrace_language_code': 'skiptrace_language_code',
  'skiptrace_match_score': 'skiptrace_match_score',
  'skiptrace_name': 'skiptrace_name',
  'skiptrace_state': 'skiptrace_state',
  'skiptrace_wireless_numbers': 'skiptrace_wireless_numbers',
  'skiptrace_zip': 'skiptrace_zip',
  
  // Other fields (not available in scraping)
  'uuid': 'uuid',
  'valid_phones': 'valid_phones',
  'social_connections': 'social_connections',
};

// Fields that can be enriched by scraping agents
const SCRAPABLE_FIELDS: EnrichFieldKey[] = [
  'company_name',
  'company_domain',
  'industry',
  'company_revenue',
  'company_address',
  'company_phone',
  'company_linkedin_url',
  'linkedin_url',
  'twitter_url',
  'facebook_url',
];

// Fields that require custom extraction
const CUSTOM_FIELDS: EnrichFieldKey[] = [
  'employee_count',
  'company_phone',
  'company_linkedin_url',
  'linkedin_url',
  'twitter_url',
  'facebook_url',
];

// Simplified validation function
function validateEnrichmentRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.identifiers || Object.keys(request.identifiers).length === 0) {
    errors.push('At least one identifier (email, domain, or company_name) is required');
  }
  
  if (!request.fields || request.fields.length === 0) {
    errors.push('At least one field to enrich is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Simplified field mapping function
function mapFieldsToAgents(fields: string[]): Record<string, string[]> {
  // This is a simplified mapping - in a real implementation, this would map to specific agents
  return {
    'company_info': fields.filter(f => ['company_name', 'company_domain', 'industry'].includes(f)),
    'social_media': fields.filter(f => ['linkedin_url', 'twitter_url', 'facebook_url'].includes(f)),
    'contact_info': fields.filter(f => ['company_phone', 'company_address'].includes(f)),
  };
}

export async function enrichRowWithScraping(
  row: Record<string, any>, 
  fieldsToEnrich: EnrichFieldKey[]
): Promise<ScrapingEnrichmentResponse> {
  try {
    // Check if scraping is configured
    if (!miscConfig.firecrawlApiKey || !miscConfig.openaiApiKey) {
      console.warn('Scraping enrichment not configured - missing API keys');
      return {
        error: 'Scraping enrichment not configured - missing API keys',
      };
    }

    // Filter fields that can be enriched by scraping
    const scrapableFields = fieldsToEnrich.filter(field => 
      SCRAPABLE_FIELDS.includes(field)
    );

    if (scrapableFields.length === 0) {
      console.log('No scrapable fields requested, skipping scraping enrichment');
      return {};
    }

    // Build the enrichment request
    const request: any = {
      identifiers: {},
      fields: [],
      customFields: [],
    };

    // Add available identifiers from the row
    if (row.business_email) {
      request.identifiers.email = row.business_email;
    } else if (row.email) {
      request.identifiers.email = row.email;
    } else if (row.personal_email) {
      request.identifiers.email = row.personal_email;
    }
    
    if (row.domain) {
      request.identifiers.domain = row.domain;
    } else if (row.company_domain) {
      request.identifiers.domain = row.company_domain;
    }
    
    if (row.company_name) {
      request.identifiers.companyName = row.company_name;
    }

    // Check if we have at least one identifier
    const hasEmail = request.identifiers.email && request.identifiers.email.trim() !== '';
    const hasDomain = request.identifiers.domain && request.identifiers.domain.trim() !== '';
    const hasCompanyName = request.identifiers.companyName && request.identifiers.companyName.trim() !== '';
    
    if (!hasEmail && !hasDomain && !hasCompanyName) {
      console.warn('No identifiers available for scraping enrichment:', {
        row: Object.keys(row),
        availableFields: Object.keys(row).filter(key => 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('domain') || 
          key.toLowerCase().includes('company')
        ),
        rowData: row
      });
      return {
        error: 'No identifiers (email, domain, or company_name) available for scraping enrichment',
      };
    }

    // Map enrichment fields to scraping agent fields
    scrapableFields.forEach(field => {
      const mappedField = FIELD_MAPPING[field];
      if (mappedField) {
        if (CUSTOM_FIELDS.includes(field)) {
          request.customFields!.push(mappedField);
        } else {
          request.fields.push(mappedField);
        }
      }
    });

    console.log('Scraping enrichment request:', {
      identifiers: request.identifiers,
      fields: request.fields,
      customFields: request.customFields,
      scrapableFields,
    });

    // Validate request
    const validation = validateEnrichmentRequest(request);
    if (!validation.isValid) {
      return {
        error: `Invalid scraping enrichment request: ${validation.errors.join(', ')}`,
      };
    }

    // For now, return a placeholder response since the scraping agent is not implemented
    // In a real implementation, this would call the actual scraping service
    console.log('Scraping enrichment would be executed here with:', {
      firecrawlApiKey: miscConfig.firecrawlApiKey ? 'configured' : 'missing',
      openaiApiKey: miscConfig.openaiApiKey ? 'configured' : 'missing',
      request
    });

    return {
      error: 'Scraping enrichment is not yet implemented. Please use API enrichment instead.',
    };

  } catch (error) {
    console.error('Scraping enrichment error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown scraping enrichment error',
    };
  }
}

export async function enrichBatchWithScraping(
  rows: Record<string, any>[], 
  fieldsToEnrich: EnrichFieldKey[],
  onProgress?: (completed: number, total: number) => void
): Promise<Record<string, any>[]> {
  const enrichedRows: Record<string, any>[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) {
      console.warn(`Row ${i + 1} is undefined, skipping`);
      continue;
    }
    
    const enrichment = await enrichRowWithScraping(row, fieldsToEnrich);
    
    // Check if enrichment was successful
    if (enrichment.error) {
      errorCount++;
      console.warn(`Scraping enrichment failed for row ${i + 1}:`, enrichment.error);
    } else {
      successCount++;
    }
    
    // Merge enrichment data with original row (even if there was an error)
    const enrichedRow = { ...row, ...enrichment };
    enrichedRows.push(enrichedRow);
    
    // Update progress
    onProgress?.(i + 1, rows.length);
    
    // Add a small delay to avoid overwhelming the APIs
    if (i < rows.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay for scraping
    }
  }
  
  // Log summary
  console.log(`Scraping enrichment batch completed: ${successCount} successful, ${errorCount} failed out of ${rows.length} total`);
  
  return enrichedRows;
}

// Utility function to check if scraping is available
export function isScrapingAvailable(): boolean {
  return !!(miscConfig.firecrawlApiKey && miscConfig.openaiApiKey);
}

// Utility function to get available scraping fields
export function getAvailableScrapingFields(): EnrichFieldKey[] {
  return [...SCRAPABLE_FIELDS];
}

// Utility function to get field mapping information
export function getFieldMappingInfo(): Record<string, any> {
  return {
    scrapableFields: SCRAPABLE_FIELDS,
    customFields: CUSTOM_FIELDS,
    fieldMapping: FIELD_MAPPING,
    agentMapping: mapFieldsToAgents(SCRAPABLE_FIELDS.map(field => FIELD_MAPPING[field])),
  };
} 