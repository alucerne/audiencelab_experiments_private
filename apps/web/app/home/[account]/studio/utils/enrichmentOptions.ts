// utils/enrichmentOptions.ts
export const ENRICH_FIELDS = [
  // Personal Fields
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'business_email', label: 'Business Email' },
  { key: 'personal_email', label: 'Personal Email' },
  { key: 'age', label: 'Age' },
  { key: 'age_range', label: 'Age Range' },
  { key: 'gender', label: 'Gender' },
  { key: 'children', label: 'Children' },
  { key: 'education', label: 'Education' },
  { key: 'education_history', label: 'Education History' },
  
  // Business Fields
  { key: 'company_name', label: 'Company Name' },
  { key: 'company_domain', label: 'Company Domain' },
  { key: 'industry', label: 'Industry' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'seniority', label: 'Seniority' },
  { key: 'department', label: 'Department' },
  { key: 'employee_count', label: 'Employee Count' },
  { key: 'company_revenue', label: 'Company Revenue' },
  { key: 'company_address', label: 'Company Address' },
  { key: 'company_phone', label: 'Company Phone' },
  { key: 'company_linkedin_url', label: 'Company LinkedIn URL' },
  { key: 'headline', label: 'Professional Headline' },
  { key: 'years_experience', label: 'Years of Experience' },
  { key: 'linkedin_url', label: 'LinkedIn URL' },
  { key: 'twitter_url', label: 'Twitter URL' },
  { key: 'facebook_url', label: 'Facebook URL' },
  { key: 'skills', label: 'Skills' },
  { key: 'interests', label: 'Interests' },
  
  // Contact Fields
  { key: 'mobile_phone', label: 'Mobile Phone' },
  { key: 'direct_number', label: 'Direct Phone' },
  { key: 'personal_phone', label: 'Personal Phone' },
  { key: 'deep_verified_emails', label: 'Deep Verified Emails' },
  
  // Location Fields
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'Zip Code' },
  { key: 'personal_address', label: 'Personal Address' },
  { key: 'personal_city', label: 'Personal City' },
  { key: 'personal_state', label: 'Personal State' },
  { key: 'personal_zip', label: 'Personal Zip' },
  
  // Financial Fields
  { key: 'income_range', label: 'Income Range' },
  { key: 'net_worth', label: 'Net Worth' },
  
  // Family Fields
  { key: 'homeowner', label: 'Homeowner' },
  { key: 'married', label: 'Married' },
  
  // SkipTrace Fields
  { key: 'skiptrace_address', label: 'SkipTrace Address' },
  { key: 'skiptrace_b2b_address', label: 'SkipTrace B2B Address' },
  { key: 'skiptrace_b2b_phone', label: 'SkipTrace B2B Phone' },
  { key: 'skiptrace_b2b_source', label: 'SkipTrace B2B Source' },
  { key: 'skiptrace_b2b_website', label: 'SkipTrace B2B Website' },
  { key: 'skiptrace_city', label: 'SkipTrace City' },
  { key: 'skiptrace_credit_rating', label: 'SkipTrace Credit Rating' },
  { key: 'skiptrace_dnc', label: 'SkipTrace DNC' },
  { key: 'skiptrace_ethnic_code', label: 'SkipTrace Ethnic Code' },
  { key: 'skiptrace_exact_age', label: 'SkipTrace Exact Age' },
  { key: 'skiptrace_ip', label: 'SkipTrace IP' },
  { key: 'skiptrace_landline_numbers', label: 'SkipTrace Landline Numbers' },
  { key: 'skiptrace_language_code', label: 'SkipTrace Language Code' },
  { key: 'skiptrace_match_score', label: 'SkipTrace Match Score' },
  { key: 'skiptrace_name', label: 'SkipTrace Name' },
  { key: 'skiptrace_state', label: 'SkipTrace State' },
  { key: 'skiptrace_wireless_numbers', label: 'SkipTrace Wireless Numbers' },
  { key: 'skiptrace_zip', label: 'SkipTrace Zip' },
  
  // Other Fields
  { key: 'uuid', label: 'Contact UUID' },
  { key: 'valid_phones', label: 'Valid Phones' },
  { key: 'social_connections', label: 'Social Connections' },
];

export type EnrichFieldKey = typeof ENRICH_FIELDS[number]['key']; 