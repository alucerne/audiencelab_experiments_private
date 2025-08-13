# Universal Boolean Builder Implementation

## Overview

The Universal Boolean Builder extends the original B2B Boolean Builder to support all Audience Builder filter categories with AND/OR/NOT logic. Users can now combine filters across Intent, Date, Business, Financial, Personal, Family, Housing, Location, and Contact categories to create complex audience targeting rules.

## Features

### ✅ Universal Filter Support
- **Intent**: Topics, scores, and intent-based targeting
- **Date**: Event dates, days back, and temporal filters
- **Business**: Company data, job titles, seniority, industry, employee count, revenue
- **Financial**: Income estimates, credit scores, investment assets
- **Personal**: Age, gender, education, marital status
- **Family**: Children count, household size, family composition
- **Housing**: Ownership status, property type, home value
- **Location**: Country, region, city, ZIP codes, geographic radius
- **Contact**: Email, phone, social media presence toggles

### ✅ Advanced Logic Operations
- **AND/OR Groups**: Nested logical groupings
- **NOT Operations**: Negation at both rule and group levels
- **Complex Expressions**: Multi-level nested conditions
- **Import from Simple**: Convert existing simple filters to boolean expressions

### ✅ Dynamic Value Editors
- **String**: Text input with validation
- **Number**: Numeric input with range validation
- **Number Range**: Dual input for min/max values
- **Enum**: Dropdown with predefined values
- **Enum Array**: Multi-select with badges
- **Boolean**: True/false toggles
- **Date Range**: Date picker pairs
- **Geo Radius**: Latitude, longitude, and radius inputs
- **String Array**: Multi-value input with badges

## Architecture

### Field Registry (`field-registry.ts`)

Central registry defining all available fields with their types, operators, and mappers:

```typescript
export type FieldDef = {
  key: string;           // "business.employee_count"
  label: string;         // "Employee Count"
  category: 'intent'|'date'|'business'|'financial'|'personal'|'family'|'housing'|'location'|'contact';
  valueType: ValueType;  // 'string'|'number'|'numberRange'|'enum'|'enum[]'|'boolean'|'dateRange'|'geoRadius'|'string[]'
  operators: OperatorId[]; // Allowed operators for this field
  pgMapper: string;      // Postgres field mapping
  typesenseMapper?: string; // Typesense field mapping (optional)
  enumValues?: string[]; // For enum fields
  description?: string;  // Help text
};
```

### Schema (`boolean-filters.schema.ts`)

Updated schema supporting categories and dynamic validation:

```typescript
export type Condition = {
  kind: 'condition';
  category: 'intent'|'date'|'business'|'financial'|'personal'|'family'|'housing'|'location'|'contact';
  field: string;   // Fully-qualified field key
  op: string;      // Operator from field's allowed operators
  value: unknown;  // Typed value based on field type
  not?: boolean;   // NOT operation on this condition
};
```

### Transformation Layer (`boolean-transform.ts`)

Converts boolean expressions to Postgres WHERE clauses and Typesense filters:

```typescript
export function booleanToQueries(expr: BooleanExpression) {
  const pg = buildPg(expr);
  const ts = buildTypesense(expr);
  return { 
    pgWhere: pg.clause, 
    pgParams: pg.params, 
    typesenseFilter: ts 
  };
}
```

## Implementation Details

### Value Editors

Each field type has a dedicated value editor component:

- **StringValueEditor**: Basic text input
- **NumberValueEditor**: Numeric input with validation
- **NumberRangeValueEditor**: Dual inputs for min/max ranges
- **EnumValueEditor**: Dropdown with enum values
- **EnumArrayValueEditor**: Multi-select with add/remove functionality
- **BooleanValueEditor**: True/false selector
- **DateRangeValueEditor**: Date picker pair
- **GeoRadiusValueEditor**: Lat/lng/radius inputs
- **StringArrayValueEditor**: Multi-value input with badges

### Value Editor Factory

The `ValueEditorFactory` component automatically selects the appropriate editor based on field type:

```typescript
export function ValueEditorFactory({ fieldKey, value, onChange, placeholder }) {
  const field = getFieldByKey(fieldKey);
  const valueType = field?.valueType;
  
  switch (valueType) {
    case 'string': return <StringValueEditor ... />;
    case 'number': return <NumberValueEditor ... />;
    case 'numberRange': return <NumberRangeValueEditor ... />;
    // ... etc
  }
}
```

### Boolean Rule Component

Updated to support category selection and dynamic field/operator loading:

```typescript
export function BooleanRule({ rule, onUpdate, onRemove, onToggleNot }) {
  const categories = getCategories();
  const fieldsInCategory = getFieldsByCategory(rule.category);
  const availableOperators = getOperatorsForField(rule.field);
  
  // Category → Field → Operator → Value chain
  return (
    <div>
      <CategorySelect value={rule.category} onChange={handleCategoryChange} />
      <FieldSelect value={rule.field} onChange={handleFieldChange} />
      <OperatorSelect value={rule.op} onChange={handleOperatorChange} />
      <ValueEditorFactory fieldKey={rule.field} value={rule.value} onChange={handleValueChange} />
    </div>
  );
}
```

### Simple to Boolean Conversion

The `simpleToBoolean` function converts existing simple filters to boolean expressions:

```typescript
export function simpleToBoolean(simple: Record<string, any>): Group {
  const children: Condition[] = [];
  
  // Process each filter category and convert to conditions
  if (simple.audience?.b2b?.businessProfile) {
    // Convert B2B filters
  }
  if (simple.segment) {
    // Convert intent filters
  }
  // ... etc
  
  return { kind: 'group', op: 'AND', children };
}
```

## Usage Examples

### Basic Business Targeting
```typescript
const expression: BooleanExpression = {
  kind: 'group',
  op: 'AND',
  children: [
    {
      kind: 'condition',
      category: 'business',
      field: 'business.employee_count',
      op: 'between',
      value: [51, 200]
    },
    {
      kind: 'condition',
      category: 'business',
      field: 'business.industry',
      op: 'in',
      value: ['software', 'technology']
    }
  ]
};
```

### Complex Multi-Category Targeting
```typescript
const expression: BooleanExpression = {
  kind: 'group',
  op: 'AND',
  children: [
    {
      kind: 'group',
      op: 'OR',
      children: [
        {
          kind: 'condition',
          category: 'business',
          field: 'business.seniority',
          op: 'in',
          value: ['cxo', 'vp', 'director']
        },
        {
          kind: 'condition',
          category: 'financial',
          field: 'financial.estimated_income',
          op: 'gte',
          value: 150000
        }
      ]
    },
    {
      kind: 'condition',
      category: 'location',
      field: 'location.country',
      op: 'in',
      value: ['US', 'CA']
    },
    {
      kind: 'condition',
      category: 'contact',
      field: 'contact.has_email',
      op: 'isTrue',
      value: true
    }
  ]
};
```

### NOT Operations
```typescript
const expression: BooleanExpression = {
  kind: 'group',
  op: 'AND',
  children: [
    {
      kind: 'condition',
      category: 'business',
      field: 'business.industry',
      op: 'in',
      value: ['software'],
      not: true  // NOT in software industry
    },
    {
      kind: 'group',
      op: 'OR',
      not: true,  // NOT the entire group
      children: [
        {
          kind: 'condition',
          category: 'contact',
          field: 'contact.has_phone',
          op: 'isTrue',
          value: true
        },
        {
          kind: 'condition',
          category: 'contact',
          field: 'contact.has_linkedin',
          op: 'isTrue',
          value: true
        }
      ]
    }
  ]
};
```

## Testing

### Unit Tests (`boolean-transform-universal.test.ts`)

Comprehensive test coverage for all filter categories and operators:

- Intent + Business combinations
- Date ranges with NOT operations
- Geographic radius queries
- Financial and Personal filters
- Family and Housing filters
- Contact toggles
- Enum arrays and string arrays
- Number ranges
- Nested groups and complex expressions

### Integration Tests

Test the full UI flow:
- Category selection
- Field and operator dropdowns
- Value editor interactions
- Import from simple filters
- Form submission and validation

## Access Control

The Boolean Builder respects existing access controls:

- **B2B Access**: Required for business category filters
- **Intent Access**: Required for intent category filters
- **Feature Flags**: Controlled by credits/permissions system
- **Partner Limits**: Enforced through existing permission checks

## Backward Compatibility

- **Simple Mode**: Unchanged, continues to work as before
- **Data Storage**: Same `audience.filters` JSON structure
- **API Compatibility**: Existing endpoints work with both modes
- **Migration**: Simple filters can be imported to boolean mode

## Performance Considerations

- **Field Registry**: Static configuration, no runtime overhead
- **Value Editors**: Lazy-loaded based on field type
- **Validation**: Client-side Zod validation with server-side verification
- **Query Generation**: Efficient recursive traversal of expression tree
- **Caching**: Field definitions and operators cached in memory

## Future Enhancements

### Planned Features
- **Saved Templates**: Pre-built boolean expressions for common use cases
- **Expression Library**: Community-shared targeting rules
- **Advanced Geo**: Polygon shapes, custom geographic boundaries
- **Time-based Logic**: Relative date expressions (e.g., "last 30 days")
- **A/B Testing**: Compare different boolean expressions

### Technical Improvements
- **Query Optimization**: Smart query planning for complex expressions
- **Real-time Preview**: Live audience size estimates
- **Expression Analytics**: Usage patterns and performance metrics
- **API Rate Limiting**: Protect against expensive boolean queries

## Troubleshooting

### Common Issues

1. **Unknown Field Errors**: Check field registry for correct field keys
2. **Operator Validation**: Ensure operator is allowed for the selected field
3. **Value Type Mismatches**: Verify value matches field's expected type
4. **Geo Radius Issues**: Ensure PostGIS is available for geographic queries

### Debug Tools

- **Console Logging**: Detailed expression transformation logs
- **Validation Errors**: Clear error messages for invalid expressions
- **Preview Mode**: Human-readable expression preview
- **Test Coverage**: Comprehensive unit tests for all scenarios

## Conclusion

The Universal Boolean Builder provides a powerful, flexible interface for creating complex audience targeting rules across all filter categories. It maintains backward compatibility while offering advanced logical operations and dynamic value editing capabilities.

The implementation follows best practices for type safety, validation, and performance, making it suitable for production use in high-scale audience targeting applications. 