export type ValueType =
  | 'string' | 'string[]'
  | 'number' | 'numberRange' | 'number[]'
  | 'enum' | 'enum[]'
  | 'boolean'
  | 'date' | 'dateRange'
  | 'geoPoint' | 'geoRadius'
  ;

export type OperatorId =
  // common
  'eq'|'neq'|'in'|'nin'|'contains'|'icontains'|
  'gte'|'lte'|'gt'|'lt'|
  'between'|'exists'|'notExists'|
  // full-text / intent
  'match'|'matchAny'|
  // geo
  'withinRadius'|
  // toggles
  'isTrue'|'isFalse'
  ;

export type FieldDef = {
  key: string;           // "business.employee_count"
  label: string;         // "Employee Count"
  category: 'intent'|'date'|'business'|'financial'|'personal'|'family'|'housing'|'location'|'contact';
  valueType: ValueType;
  operators: OperatorId[]; // whitelist for UI + validation
  // hook ids that delegate to existing simple mappers:
  pgMapper: string;         // e.g. "business.employee_count"
  typesenseMapper?: string; // if applicable for intent/typesense
  enumValues?: string[];    // for enum/enum[] fields
  description?: string;     // optional help text
};

export const FIELD_REGISTRY: FieldDef[] = [
  // Intent
  { 
    key: 'intent.topics', 
    label: 'Intent Topics', 
    category: 'intent', 
    valueType: 'string[]', 
    operators: ['matchAny', 'in', 'nin'], 
    pgMapper: 'intent.topics', 
    typesenseMapper: 'intent.topics',
    description: 'Topics the contact has shown interest in'
  },
  { 
    key: 'intent.score', 
    label: 'Intent Score', 
    category: 'intent', 
    valueType: 'number', 
    operators: ['gte', 'lte', 'between'], 
    pgMapper: 'intent.score', 
    typesenseMapper: 'intent.score',
    description: 'Overall intent score (0-100)'
  },

  // Date
  { 
    key: 'date.event_date', 
    label: 'Event Date', 
    category: 'date', 
    valueType: 'dateRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'date.event_date',
    description: 'Date range for events or activities'
  },
  { 
    key: 'date.days_back', 
    label: 'Days Back', 
    category: 'date', 
    valueType: 'number', 
    operators: ['eq', 'gte', 'lte', 'between'], 
    pgMapper: 'date.days_back',
    description: 'Number of days to look back'
  },

  // Business (B2B)
  { 
    key: 'business.seniority', 
    label: 'Seniority', 
    category: 'business', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['cxo', 'vp', 'director', 'manager', 'staff'], 
    pgMapper: 'business.seniority',
    description: 'Job seniority level'
  },
  { 
    key: 'business.department', 
    label: 'Department', 
    category: 'business', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['administrative', 'engineering', 'executive', 'finance', 'marketing', 'sales'], 
    pgMapper: 'business.department',
    description: 'Department or functional area'
  },
  { 
    key: 'business.employee_count', 
    label: 'Employee Count', 
    category: 'business', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'business.employee_count',
    description: 'Company size by employee count'
  },
  { 
    key: 'business.revenue', 
    label: 'Revenue', 
    category: 'business', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'business.revenue',
    description: 'Company annual revenue'
  },
  { 
    key: 'business.industry', 
    label: 'Industry', 
    category: 'business', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: [
      'software', 'healthcare', 'finance', 'retail', 'manufacturing', 'education',
      'real_estate', 'consulting', 'media', 'telecommunications', 'transportation',
      'energy', 'government', 'non_profit', 'other'
    ], 
    pgMapper: 'business.industry',
    description: 'Primary industry sector'
  },
  { 
    key: 'business.company_name', 
    label: 'Company Name', 
    category: 'business', 
    valueType: 'string', 
    operators: ['eq', 'contains', 'icontains', 'starts_with', 'ends_with'], 
    pgMapper: 'business.company_name',
    description: 'Company or organization name'
  },
  { 
    key: 'business.job_title', 
    label: 'Job Title', 
    category: 'business', 
    valueType: 'string', 
    operators: ['eq', 'contains', 'icontains', 'starts_with', 'ends_with'], 
    pgMapper: 'business.job_title',
    description: 'Professional job title'
  },

  // Financial
  { 
    key: 'financial.estimated_income', 
    label: 'Estimated Income', 
    category: 'financial', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'financial.estimated_income',
    description: 'Estimated annual household income'
  },
  { 
    key: 'financial.credit_score', 
    label: 'Credit Score', 
    category: 'financial', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'financial.credit_score',
    description: 'Credit score range'
  },
  { 
    key: 'financial.investment_assets', 
    label: 'Investment Assets', 
    category: 'financial', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'financial.investment_assets',
    description: 'Total investment assets'
  },

  // Personal
  { 
    key: 'personal.age', 
    label: 'Age', 
    category: 'personal', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'personal.age',
    description: 'Age range'
  },
  { 
    key: 'personal.gender', 
    label: 'Gender', 
    category: 'personal', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['male', 'female', 'nonbinary', 'unspecified'], 
    pgMapper: 'personal.gender',
    description: 'Gender identity'
  },
  { 
    key: 'personal.education', 
    label: 'Education', 
    category: 'personal', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['high_school', 'some_college', 'bachelors', 'masters', 'doctorate'], 
    pgMapper: 'personal.education',
    description: 'Highest education level'
  },
  { 
    key: 'personal.marital_status', 
    label: 'Marital Status', 
    category: 'personal', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['single', 'married', 'divorced', 'widowed'], 
    pgMapper: 'personal.marital_status',
    description: 'Current marital status'
  },

  // Family
  { 
    key: 'family.children_count', 
    label: 'Children Count', 
    category: 'family', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'family.children_count',
    description: 'Number of children in household'
  },
  { 
    key: 'family.household_size', 
    label: 'Household Size', 
    category: 'family', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'family.household_size',
    description: 'Total household size'
  },
  { 
    key: 'family.has_children', 
    label: 'Has Children', 
    category: 'family', 
    valueType: 'boolean', 
    operators: ['isTrue', 'isFalse'], 
    pgMapper: 'family.has_children',
    description: 'Whether household has children'
  },

  // Housing
  { 
    key: 'housing.ownership_status', 
    label: 'Home Ownership', 
    category: 'housing', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['own', 'rent', 'other'], 
    pgMapper: 'housing.ownership_status',
    description: 'Home ownership status'
  },
  { 
    key: 'housing.property_type', 
    label: 'Property Type', 
    category: 'housing', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    enumValues: ['single_family', 'condo', 'townhouse', 'apartment', 'mobile'], 
    pgMapper: 'housing.property_type',
    description: 'Type of residential property'
  },
  { 
    key: 'housing.home_value', 
    label: 'Home Value', 
    category: 'housing', 
    valueType: 'numberRange', 
    operators: ['between', 'gte', 'lte'], 
    pgMapper: 'housing.home_value',
    description: 'Estimated home value'
  },

  // Location
  { 
    key: 'location.country', 
    label: 'Country', 
    category: 'location', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    pgMapper: 'location.country',
    description: 'Country of residence'
  },
  { 
    key: 'location.region', 
    label: 'State/Region', 
    category: 'location', 
    valueType: 'enum[]', 
    operators: ['in', 'nin'], 
    pgMapper: 'location.region',
    description: 'State or region'
  },
  { 
    key: 'location.city', 
    label: 'City', 
    category: 'location', 
    valueType: 'string[]', 
    operators: ['in', 'nin'], 
    pgMapper: 'location.city',
    description: 'City or cities'
  },
  { 
    key: 'location.zip_code', 
    label: 'ZIP Code', 
    category: 'location', 
    valueType: 'string[]', 
    operators: ['in', 'nin'], 
    pgMapper: 'location.zip_code',
    description: 'ZIP or postal codes'
  },
  { 
    key: 'location.geo_radius_km', 
    label: 'Geo Radius', 
    category: 'location', 
    valueType: 'geoRadius', 
    operators: ['withinRadius'], 
    pgMapper: 'location.geo_radius_km',
    description: 'Geographic radius search'
  },

  // Contact toggles
  { 
    key: 'contact.has_email', 
    label: 'Has Email', 
    category: 'contact', 
    valueType: 'boolean', 
    operators: ['isTrue', 'isFalse', 'eq'], 
    pgMapper: 'contact.has_email',
    description: 'Whether contact has email address'
  },
  { 
    key: 'contact.has_phone', 
    label: 'Has Phone', 
    category: 'contact', 
    valueType: 'boolean', 
    operators: ['isTrue', 'isFalse', 'eq'], 
    pgMapper: 'contact.has_phone',
    description: 'Whether contact has phone number'
  },
  { 
    key: 'contact.has_linkedin', 
    label: 'Has LinkedIn', 
    category: 'contact', 
    valueType: 'boolean', 
    operators: ['isTrue', 'isFalse', 'eq'], 
    pgMapper: 'contact.has_linkedin',
    description: 'Whether contact has LinkedIn profile'
  },
  { 
    key: 'contact.has_facebook', 
    label: 'Has Facebook', 
    category: 'contact', 
    valueType: 'boolean', 
    operators: ['isTrue', 'isFalse', 'eq'], 
    pgMapper: 'contact.has_facebook',
    description: 'Whether contact has Facebook profile'
  },
  { 
    key: 'contact.has_twitter', 
    label: 'Has Twitter', 
    category: 'contact', 
    valueType: 'boolean', 
    operators: ['isTrue', 'isFalse', 'eq'], 
    pgMapper: 'contact.has_twitter',
    description: 'Whether contact has Twitter profile'
  }
];

// Helper functions
export const getFieldByKey = (key: string): FieldDef | undefined => {
  return FIELD_REGISTRY.find(field => field.key === key);
};

export const getFieldsByCategory = (category: FieldDef['category']): FieldDef[] => {
  return FIELD_REGISTRY.filter(field => field.category === category);
};

export const getCategories = (): FieldDef['category'][] => {
  return [...new Set(FIELD_REGISTRY.map(field => field.category))];
};

export const getOperatorsForField = (fieldKey: string): OperatorId[] => {
  const field = getFieldByKey(fieldKey);
  return field?.operators || [];
};

export const getValueTypeForField = (fieldKey: string): ValueType | undefined => {
  const field = getFieldByKey(fieldKey);
  return field?.valueType;
};

export const getEnumValuesForField = (fieldKey: string): string[] | undefined => {
  const field = getFieldByKey(fieldKey);
  return field?.enumValues;
}; 