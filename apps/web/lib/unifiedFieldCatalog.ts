// Unified Field Catalog for Audience Studio
// This is the single source of truth for all field definitions used in Query + Filter stages

import { z } from 'zod';

export type FieldType = "string" | "number" | "timestamp" | "boolean" | "json";
export type FieldGroup = "pixel_event" | "contact";

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  group: FieldGroup;
  expr: string; // DuckDB expression to read from studio_current
}

// V1 Field Catalog - Expanded to match actual CSV data
export const FIELD_CATALOG_V1: FieldDefinition[] = [
  // ===== PIXEL EVENTS (from actual CSV data) =====
  { key: "pixel_id",            label: "Pixel ID",            type: "string",    group: "pixel_event", expr: "pixel_id" },
  { key: "hem_sha256",          label: "HEM SHA256",          type: "string",    group: "pixel_event", expr: "hem_sha256" },
  { key: "event_timestamp",     label: "Event Timestamp",     type: "timestamp", group: "pixel_event", expr: "CAST(event_timestamp AS TIMESTAMP)" },
  { key: "event_type",          label: "Event Type",          type: "string",    group: "pixel_event", expr: "event_type" },
  { key: "ip_address",          label: "IP Address",          type: "string",    group: "pixel_event", expr: "ip_address" },
  { key: "activity_start_date", label: "Activity Start Date", type: "timestamp", group: "pixel_event", expr: "CAST(activity_start_date AS TIMESTAMP)" },
  { key: "activity_end_date",   label: "Activity End Date",   type: "timestamp", group: "pixel_event", expr: "CAST(activity_end_date AS TIMESTAMP)" },
  { key: "referrer_url",        label: "Referrer URL",        type: "string",    group: "pixel_event", expr: "referrer_url" },
  { key: "referrer",            label: "Referrer",            type: "string",    group: "pixel_event", expr: "referrer" },
  { key: "timestamp",           label: "Timestamp",           type: "timestamp", group: "pixel_event", expr: "CAST(timestamp AS TIMESTAMP)" },
  { key: "title",               label: "Title",               type: "string",    group: "pixel_event", expr: "title" },
  { key: "url",                 label: "URL",                 type: "string",    group: "pixel_event", expr: "url" },
  { key: "percentage",          label: "Percentage",          type: "number",    group: "pixel_event", expr: "percentage" },
  { key: "class",               label: "Class",               type: "string",    group: "pixel_event", expr: "class" },
  { key: "href",                label: "Href",                type: "string",    group: "pixel_event", expr: "href" },
  { key: "classes",             label: "Classes",             type: "string",    group: "pixel_event", expr: "classes" },
  { key: "id",                  label: "ID",                  type: "string",    group: "pixel_event", expr: "id" },
  { key: "tag",                 label: "Tag",                 type: "string",    group: "pixel_event", expr: "tag" },
  { key: "text",                label: "Text",                type: "string",    group: "pixel_event", expr: "text" },

  // ===== CONTACT DATA (from actual CSV data) =====
  { key: "AGE_RANGE",                    label: "Age Range",                    type: "string", group: "contact", expr: "AGE_RANGE" },
  { key: "BUSINESS_EMAIL",               label: "Business Email",               type: "string", group: "contact", expr: "BUSINESS_EMAIL" },
  { key: "BUSINESS_EMAIL_VALIDATION_STATUS", label: "Business Email Validation Status", type: "string", group: "contact", expr: "BUSINESS_EMAIL_VALIDATION_STATUS" },
  { key: "PROGRAMMATIC_BUSINESS_EMAILS", label: "Programmatic Business Emails", type: "string", group: "contact", expr: "PROGRAMMATIC_BUSINESS_EMAILS" },
  { key: "BUSINESS_EMAIL_LAST_SEEN",     label: "Business Email Last Seen",     type: "json", group: "contact", expr: "BUSINESS_EMAIL_LAST_SEEN" },
  { key: "CHILDREN",                     label: "Children",                     type: "string", group: "contact", expr: "CHILDREN" },
  { key: "COMPANY_ADDRESS",              label: "Company Address",              type: "string", group: "contact", expr: "COMPANY_ADDRESS" },
  { key: "COMPANY_CITY",                 label: "Company City",                 type: "string", group: "contact", expr: "COMPANY_CITY" },
  { key: "COMPANY_DESCRIPTION",          label: "Company Description",          type: "string", group: "contact", expr: "COMPANY_DESCRIPTION" },
  { key: "COMPANY_DOMAIN",               label: "Company Domain",               type: "string", group: "contact", expr: "COMPANY_DOMAIN" },
  { key: "COMPANY_EMPLOYEE_COUNT",       label: "Company Employee Count",       type: "string", group: "contact", expr: "COMPANY_EMPLOYEE_COUNT" },
  { key: "COMPANY_INDUSTRY",             label: "Company Industry",             type: "string", group: "contact", expr: "COMPANY_INDUSTRY" },
  { key: "COMPANY_NAICS",                label: "Company NAICS",                type: "string", group: "contact", expr: "COMPANY_NAICS" },
  { key: "COMPANY_NAME",                 label: "Company Name",                 type: "string", group: "contact", expr: "COMPANY_NAME" },
  { key: "COMPANY_NAME_HISTORY",         label: "Company Name History",         type: "string", group: "contact", expr: "COMPANY_NAME_HISTORY" },
  { key: "COMPANY_PHONE",                label: "Company Phone",                type: "string", group: "contact", expr: "COMPANY_PHONE" },
  { key: "COMPANY_REVENUE",              label: "Company Revenue",              type: "string", group: "contact", expr: "COMPANY_REVENUE" },
  { key: "COMPANY_SIC",                  label: "Company SIC",                  type: "string", group: "contact", expr: "COMPANY_SIC" },
  { key: "COMPANY_STATE",                label: "Company State",                type: "string", group: "contact", expr: "COMPANY_STATE" },
  { key: "COMPANY_ZIP",                  label: "Company ZIP",                  type: "string", group: "contact", expr: "COMPANY_ZIP" },
  { key: "COMPANY_LINKEDIN_URL",         label: "Company LinkedIn URL",         type: "string", group: "contact", expr: "COMPANY_LINKEDIN_URL" },
  { key: "COMPANY_LAST_UPDATED",         label: "Company Last Updated",         type: "json", group: "contact", expr: "COMPANY_LAST_UPDATED" },
  { key: "DEEP_VERIFIED_EMAILS",         label: "Deep Verified Emails",         type: "string", group: "contact", expr: "DEEP_VERIFIED_EMAILS" },
  { key: "DEPARTMENT",                   label: "Department",                   type: "string", group: "contact", expr: "DEPARTMENT" },
  { key: "DIRECT_NUMBER",                label: "Direct Number",                type: "string", group: "contact", expr: "DIRECT_NUMBER" },
  { key: "DIRECT_NUMBER_DNC",            label: "Direct Number DNC",            type: "string", group: "contact", expr: "DIRECT_NUMBER_DNC" },
  { key: "EDUCATION_HISTORY",            label: "Education History",            type: "string", group: "contact", expr: "EDUCATION_HISTORY" },
  { key: "FACEBOOK_URL",                 label: "Facebook URL",                 type: "string", group: "contact", expr: "FACEBOOK_URL" },
  { key: "FIRST_NAME",                   label: "First Name",                   type: "string", group: "contact", expr: "FIRST_NAME" },
  { key: "GENDER",                       label: "Gender",                       type: "string", group: "contact", expr: "GENDER" },
  { key: "HEADLINE",                     label: "Headline",                     type: "string", group: "contact", expr: "HEADLINE" },
  { key: "HOMEOWNER",                    label: "Homeowner",                    type: "string", group: "contact", expr: "HOMEOWNER" },
  { key: "INCOME_RANGE",                 label: "Income Range",                 type: "string", group: "contact", expr: "INCOME_RANGE" },
  { key: "INFERRED_YEARS_EXPERIENCE",    label: "Inferred Years Experience",    type: "string", group: "contact", expr: "INFERRED_YEARS_EXPERIENCE" },
  { key: "INTERESTS",                    label: "Interests",                    type: "string", group: "contact", expr: "INTERESTS" },
  { key: "JOB_TITLE",                    label: "Job Title",                    type: "string", group: "contact", expr: "JOB_TITLE" },
  { key: "JOB_TITLE_LAST_UPDATED",       label: "Job Title Last Updated",       type: "json", group: "contact", expr: "JOB_TITLE_LAST_UPDATED" },
  { key: "JOB_TITLE_HISTORY",            label: "Job Title History",            type: "string", group: "contact", expr: "JOB_TITLE_HISTORY" },
  { key: "LAST_NAME",                    label: "Last Name",                    type: "string", group: "contact", expr: "LAST_NAME" },
  { key: "LINKEDIN_URL",                 label: "LinkedIn URL",                 type: "string", group: "contact", expr: "LINKEDIN_URL" },
  { key: "MARRIED",                      label: "Married",                      type: "string", group: "contact", expr: "MARRIED" },
  { key: "MOBILE_PHONE",                 label: "Mobile Phone",                 type: "string", group: "contact", expr: "MOBILE_PHONE" },
  { key: "MOBILE_PHONE_DNC",             label: "Mobile Phone DNC",             type: "string", group: "contact", expr: "MOBILE_PHONE_DNC" },
  { key: "NET_WORTH",                    label: "Net Worth",                    type: "string", group: "contact", expr: "NET_WORTH" },
  { key: "PERSONAL_ADDRESS",             label: "Personal Address",             type: "string", group: "contact", expr: "PERSONAL_ADDRESS" },
  { key: "PERSONAL_CITY",                label: "Personal City",                type: "string", group: "contact", expr: "PERSONAL_CITY" },
  { key: "PERSONAL_EMAIL",               label: "Personal Email",               type: "string", group: "contact", expr: "PERSONAL_EMAIL" },
  { key: "ADDITIONAL_PERSONAL_EMAILS",   label: "Additional Personal Emails",   type: "string", group: "contact", expr: "ADDITIONAL_PERSONAL_EMAILS" },
  { key: "PERSONAL_EMAIL_VALIDATION_STATUS", label: "Personal Email Validation Status", type: "string", group: "contact", expr: "PERSONAL_EMAIL_VALIDATION_STATUS" },
  { key: "PERSONAL_EMAIL_LAST_SEEN",     label: "Personal Email Last Seen",     type: "json", group: "contact", expr: "PERSONAL_EMAIL_LAST_SEEN" },
  { key: "PERSONAL_PHONE",               label: "Personal Phone",               type: "string", group: "contact", expr: "PERSONAL_PHONE" },
  { key: "PERSONAL_PHONE_DNC",           label: "Personal Phone DNC",           type: "string", group: "contact", expr: "PERSONAL_PHONE_DNC" },
  { key: "PERSONAL_STATE",               label: "Personal State",               type: "string", group: "contact", expr: "PERSONAL_STATE" },
  { key: "PERSONAL_ZIP",                 label: "Personal ZIP",                 type: "string", group: "contact", expr: "PERSONAL_ZIP" },
  { key: "PERSONAL_ZIP4",                label: "Personal ZIP4",                type: "string", group: "contact", expr: "PERSONAL_ZIP4" },
  { key: "SENIORITY_LEVEL",              label: "Seniority Level",              type: "string", group: "contact", expr: "SENIORITY_LEVEL" },
  { key: "PROFESSIONAL_ADDRESS",         label: "Professional Address",         type: "string", group: "contact", expr: "PROFESSIONAL_ADDRESS" },
  { key: "PROFESSIONAL_ADDRESS_2",       label: "Professional Address 2",       type: "string", group: "contact", expr: "PROFESSIONAL_ADDRESS_2" },
  { key: "PROFESSIONAL_CITY",            label: "Professional City",            type: "string", group: "contact", expr: "PROFESSIONAL_CITY" },
  { key: "PROFESSIONAL_STATE",           label: "Professional State",           type: "string", group: "contact", expr: "PROFESSIONAL_STATE" },
  { key: "PROFESSIONAL_ZIP",             label: "Professional ZIP",             type: "string", group: "contact", expr: "PROFESSIONAL_ZIP" },
  { key: "PROFESSIONAL_ZIP4",            label: "Professional ZIP4",            type: "string", group: "contact", expr: "PROFESSIONAL_ZIP4" },
  { key: "SHA256_BUSINESS_EMAIL",        label: "SHA256 Business Email",        type: "string", group: "contact", expr: "SHA256_BUSINESS_EMAIL" },
  { key: "SHA256_PERSONAL_EMAIL",        label: "SHA256 Personal Email",        type: "string", group: "contact", expr: "SHA256_PERSONAL_EMAIL" },
  { key: "SKILLS",                       label: "Skills",                       type: "string", group: "contact", expr: "SKILLS" },
  { key: "SKIPTRACE_ADDRESS",            label: "Skiptrace Address",            type: "string", group: "contact", expr: "SKIPTRACE_ADDRESS" },
  { key: "SKIPTRACE_B2B_ADDRESS",        label: "Skiptrace B2B Address",        type: "string", group: "contact", expr: "SKIPTRACE_B2B_ADDRESS" },
  { key: "SKIPTRACE_B2B_PHONE",          label: "Skiptrace B2B Phone",          type: "string", group: "contact", expr: "SKIPTRACE_B2B_PHONE" },
  { key: "SKIPTRACE_B2B_SOURCE",         label: "Skiptrace B2B Source",         type: "string", group: "contact", expr: "SKIPTRACE_B2B_SOURCE" },
  { key: "SKIPTRACE_B2B_WEBSITE",        label: "Skiptrace B2B Website",        type: "string", group: "contact", expr: "SKIPTRACE_B2B_WEBSITE" },
  { key: "SKIPTRACE_B2B_COMPANY_NAME",   label: "Skiptrace B2B Company Name",   type: "string", group: "contact", expr: "SKIPTRACE_B2B_COMPANY_NAME" },
  { key: "SKIPTRACE_B2B_MATCH_SCORE",    label: "Skiptrace B2B Match Score",    type: "string", group: "contact", expr: "SKIPTRACE_B2B_MATCH_SCORE" },
  { key: "SKIPTRACE_CITY",               label: "Skiptrace City",               type: "string", group: "contact", expr: "SKIPTRACE_CITY" },
  { key: "SKIPTRACE_CREDIT_RATING",      label: "Skiptrace Credit Rating",      type: "string", group: "contact", expr: "SKIPTRACE_CREDIT_RATING" },
  { key: "SKIPTRACE_DNC",                label: "Skiptrace DNC",                type: "string", group: "contact", expr: "SKIPTRACE_DNC" },
  { key: "SKIPTRACE_ETHNIC_CODE",        label: "Skiptrace Ethnic Code",        type: "string", group: "contact", expr: "SKIPTRACE_ETHNIC_CODE" },
  { key: "SKIPTRACE_EXACT_AGE",          label: "Skiptrace Exact Age",          type: "string", group: "contact", expr: "SKIPTRACE_EXACT_AGE" },
  { key: "SKIPTRACE_IP",                 label: "Skiptrace IP",                 type: "string", group: "contact", expr: "SKIPTRACE_IP" },
  { key: "SKIPTRACE_LANDLINE_NUMBERS",   label: "Skiptrace Landline Numbers",   type: "string", group: "contact", expr: "SKIPTRACE_LANDLINE_NUMBERS" },
  { key: "SKIPTRACE_LANGUAGE_CODE",      label: "Skiptrace Language Code",      type: "string", group: "contact", expr: "SKIPTRACE_LANGUAGE_CODE" },
  { key: "SKIPTRACE_MATCH_SCORE",        label: "Skiptrace Match Score",        type: "string", group: "contact", expr: "SKIPTRACE_MATCH_SCORE" },
  { key: "SKIPTRACE_NAME",               label: "Skiptrace Name",               type: "string", group: "contact", expr: "SKIPTRACE_NAME" },
  { key: "SKIPTRACE_STATE",              label: "Skiptrace State",              type: "string", group: "contact", expr: "SKIPTRACE_STATE" },
  { key: "SKIPTRACE_WIRELESS_NUMBERS",   label: "Skiptrace Wireless Numbers",   type: "string", group: "contact", expr: "SKIPTRACE_WIRELESS_NUMBERS" },
  { key: "SKIPTRACE_ZIP",                label: "Skiptrace ZIP",                type: "string", group: "contact", expr: "SKIPTRACE_ZIP" },
  { key: "SOCIAL_CONNECTIONS",           label: "Social Connections",           type: "string", group: "contact", expr: "SOCIAL_CONNECTIONS" },
  { key: "UUID",                         label: "UUID",                         type: "string", group: "contact", expr: "UUID" },
  { key: "DNC",                          label: "DNC",                          type: "string", group: "contact", expr: "DNC" },
];

// Helper maps for efficient lookups
export const FIELD_EXPR_MAP_V1 = Object.fromEntries(
  FIELD_CATALOG_V1.map(f => [f.key, f.expr])
);

export const FIELD_TYPE_MAP_V1 = Object.fromEntries(
  FIELD_CATALOG_V1.map(f => [f.key, f.type])
);

// Build SELECT list in correct order (source columns first, then derived columns)
function buildOrderedSelectList(): string {
  // First, get all source columns (not JSON extractions)
  const sourceColumns = FIELD_CATALOG_V1.filter(field => 
    !field.expr.includes('json_extract') && 
    !field.expr.includes('json_extract_string')
  );
  
  // Then, get all derived columns (JSON extractions)
  const derivedColumns = FIELD_CATALOG_V1.filter(field => 
    field.expr.includes('json_extract') || 
    field.expr.includes('json_extract_string')
  );
  
  // Combine in correct order: source first, then derived
  const orderedFields = [...sourceColumns, ...derivedColumns];
  
  return orderedFields
    .map(f => `${f.expr} AS "${f.key}"`)
    .join(',\n  ');
}

export const FIELD_SELECT_LIST_V1 = buildOrderedSelectList();

// Helper functions
export function getFieldByKey(key: string): FieldDefinition | undefined {
  return FIELD_CATALOG_V1.find(field => field.key === key);
}

export function getFieldExpression(key: string): string {
  const field = getFieldByKey(key);
  return field?.expr || key;
}

export function getFieldsByGroup(group: FieldGroup): FieldDefinition[] {
  return FIELD_CATALOG_V1.filter(field => field.group === group);
}

export function getFieldsByType(type: FieldType): FieldDefinition[] {
  return FIELD_CATALOG_V1.filter(field => field.type === type);
}

// Create the unified DuckDB view SQL
export function createUnifiedFiltersView(): string {
  const fieldExpressions = FIELD_CATALOG_V1
    .map(field => `${field.expr} AS "${field.key}"`)
    .join(',\n  ');

  return `
CREATE OR REPLACE VIEW filters_attributes AS
SELECT
  ${fieldExpressions}
FROM studio_current;
  `.trim();
}

// Zod validation schemas
export const FilterRuleSchema = z.object({
  field: z.string().refine(
    (field) => FIELD_CATALOG_V1.some(f => f.key === field),
    (field) => ({ message: `Unknown field: ${field}` })
  ),
  op: z.enum(['=', '!=', '>', '<', '>=', '<=', 'contains', 'starts_with', 'ends_with', 'exists', 'in']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
});

export const FilterTreeSchema = z.object({
  combinator: z.enum(['and', 'or']).optional(),
  rules: z.array(FilterRuleSchema)
});

// Validation function
export function validateFilterRules(rules: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const result = FilterRuleSchema.safeParse(rule);
    
    if (!result.success) {
      errors.push(`Rule ${i + 1}: ${result.error.errors.map(e => e.message).join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Backward compatibility exports
export const FIELD_CATALOG = FIELD_CATALOG_V1;
export const FIELD_EXPR_MAP = FIELD_EXPR_MAP_V1;
export const FIELD_SELECT_LIST = FIELD_SELECT_LIST_V1; 