# B2B Boolean Builder Implementation

## Overview

The B2B Boolean Builder is an advanced filtering system that allows users to create complex B2B audience filters using boolean logic (AND/OR/NOT) with nested groups and conditions. This feature extends the existing simple filter system while maintaining backward compatibility.

## Features

### Core Functionality
- **Mode Toggle**: Switch between Simple and Boolean builder modes
- **Boolean Logic**: Support for AND, OR, and NOT operations
- **Nested Groups**: Create complex filter hierarchies
- **B2B Field Support**: Filter on business-specific fields like company name, industry, employee count, etc.
- **Access Control**: Respects existing B2B permissions
- **Backward Compatibility**: Existing simple filters continue to work

### UI Components
- **BuilderHeader**: Mode toggle with permission checks
- **BooleanBuilder**: Main builder interface
- **BooleanGroup**: Nested group management
- **BooleanRule**: Individual filter condition management

## Architecture

### Data Model

```typescript
// Filter mode for audience builder
export type FilterMode = 'simple' | 'boolean';

// A leaf condition must be something the current mappers already understand
export type Condition = {
  kind: 'condition';
  field: string;         // matches existing B2B unified field catalog keys
  op: string;            // existing operator id used today
  value: unknown;        // validated by the same per-field operator rules as today
  not?: boolean;         // NOT on the leaf
};

export type Group = {
  kind: 'group';
  op: 'AND' | 'OR';
  not?: boolean;         // negates the entire group
  children: Array<Group | Condition>;
};

export type BooleanExpression = Group; // root must be a group

export type AudienceFilters = {
  mode?: FilterMode;              // default 'simple' if omitted
  simple?: Record<string, any>;   // existing structure (unchanged)
  boolean?: { expression: BooleanExpression } | null;
};
```

### Transformation Layer

The `boolean-transform.ts` module converts boolean expressions into:
- **Postgres WHERE clauses** with parameterized queries
- **Typesense filter strings** for intent targeting

Key functions:
- `booleanToQueries(expression)`: Main transformation function
- `mapConditionToPg(condition)`: Convert single condition to Postgres
- `mapConditionToTypesense(condition)`: Convert single condition to Typesense
- `isB2BField(field)`: Validate B2B field access
- `getFieldOperators(field)`: Get available operators for a field

### Validation

Uses Zod schemas for validation:
- `zCondition`: Validate individual conditions
- `zGroup`: Validate groups (with recursive validation)
- `zBooleanExpression`: Validate complete expressions
- `zAudienceFilters`: Validate the complete filter structure

## Implementation Details

### File Structure

```
apps/web/app/home/[account]/audience/[id]/_components/
├── boolean-builder/
│   ├── BooleanBuilder.tsx      # Main builder component
│   ├── BooleanGroup.tsx        # Group management
│   ├── BooleanRule.tsx         # Rule management
│   └── index.ts               # Export file
├── BuilderHeader.tsx           # Mode toggle header
└── audience-filters-form.tsx   # Updated main form

apps/web/lib/audience/
├── schema/
│   └── boolean-filters.schema.ts  # Types and validation
├── boolean-transform.ts           # Transformation logic
└── __tests__/
    └── boolean-transform.test.ts  # Unit tests
```

### Key Components

#### BuilderHeader
- Mode toggle between Simple and Boolean
- Permission-based access control
- Preview and Generate buttons
- Visual indicators for current mode

#### BooleanBuilder
- Root component for boolean expression management
- Handles adding/removing rules and groups
- Provides expression preview
- Reset functionality

#### BooleanGroup
- Manages nested groups with AND/OR operations
- NOT toggle for group negation
- Add rule/group buttons
- Visual hierarchy with indentation

#### BooleanRule
- Individual filter condition management
- Field selection from B2B catalog
- Operator selection based on field type
- Value input with type-specific handling
- NOT toggle for condition negation

### B2B Field Support

Supported B2B fields:
- `COMPANY_NAME`: Company name filtering
- `COMPANY_DOMAIN`: Company domain filtering
- `COMPANY_DESCRIPTION`: Business description keywords
- `JOB_TITLE`: Job title filtering
- `SENIORITY_LEVEL`: Seniority level filtering
- `DEPARTMENT`: Department filtering
- `INDUSTRY`: Industry classification
- `SIC`: Standard Industrial Classification codes
- `NAICS`: North American Industry Classification System
- `EMPLOYEE_COUNT`: Company size filtering
- `COMPANY_REVENUE`: Revenue range filtering
- `SKIPTRACE_B2B_*`: B2B contact information fields

### Operators by Field Type

#### String Fields
- `equals`: Exact match
- `contains`: Substring match
- `starts_with`: Prefix match
- `ends_with`: Suffix match
- `in`: Multiple value match
- `exists`: Field has value

#### Numeric Fields
- `equals`: Exact match
- `greater_than`: Numeric comparison
- `less_than`: Numeric comparison
- `in`: Multiple value match
- `exists`: Field has value

#### Array Fields
- `equals`: Exact match
- `contains`: Array contains value
- `in`: Multiple value match
- `exists`: Field has value

## Usage Examples

### Simple Condition
```typescript
{
  kind: 'group',
  op: 'AND',
  children: [{
    kind: 'condition',
    field: 'COMPANY_NAME',
    op: 'equals',
    value: 'Acme Corp'
  }]
}
```

### AND Operation
```typescript
{
  kind: 'group',
  op: 'AND',
  children: [
    {
      kind: 'condition',
      field: 'COMPANY_NAME',
      op: 'contains',
      value: 'Tech'
    },
    {
      kind: 'condition',
      field: 'EMPLOYEE_COUNT',
      op: 'greater_than',
      value: 100
    }
  ]
}
```

### OR Operation with NOT
```typescript
{
  kind: 'group',
  op: 'OR',
  children: [
    {
      kind: 'condition',
      field: 'INDUSTRY',
      op: 'equals',
      value: 'Technology'
    },
    {
      kind: 'condition',
      field: 'INDUSTRY',
      op: 'equals',
      value: 'Finance',
      not: true
    }
  ]
}
```

### Nested Groups
```typescript
{
  kind: 'group',
  op: 'AND',
  children: [
    {
      kind: 'condition',
      field: 'COMPANY_NAME',
      op: 'contains',
      value: 'Software'
    },
    {
      kind: 'group',
      op: 'OR',
      children: [
        {
          kind: 'condition',
          field: 'EMPLOYEE_COUNT',
          op: 'greater_than',
          value: 50
        },
        {
          kind: 'condition',
          field: 'COMPANY_REVENUE',
          op: 'greater_than',
          value: 1000000
        }
      ]
    }
  ]
}
```

## Testing

### Unit Tests
- `boolean-transform.test.ts`: Tests for query transformation
- Covers Postgres and Typesense query generation
- Tests all operators and boolean logic combinations
- Tests edge cases like empty groups and NOT operations

### Integration Tests
- `boolean-builder.integration.test.tsx`: Component integration tests
- Tests user interactions and state management
- Tests form validation and submission
- Tests permission-based access control

## Access Control

The Boolean Builder respects existing B2B access controls:
- Only users with `b2bAccess: true` can use Boolean mode
- Toggle is disabled with tooltip for users without access
- Server-side validation prevents unauthorized usage
- Uses existing credits/permissions system

## Backward Compatibility

- Existing simple filters continue to work unchanged
- New `mode` field defaults to 'simple' for existing audiences
- Simple filters are preserved when switching modes
- Database schema is non-breaking

## Future Enhancements

### Nice-to-Have Features
- Import current Simple filters into Boolean Builder
- Human-readable inline summary
- Undo/redo functionality
- Advanced field suggestions
- Saved filter templates

### Performance Optimizations
- Lazy loading of field options
- Debounced preview generation
- Cached field metadata
- Optimized query generation

## Deployment Notes

1. **Database**: No migration required (backward compatible)
2. **Frontend**: New components and updated form
3. **Backend**: Updated filter processing logic
4. **Testing**: Run unit and integration tests
5. **Access Control**: Verify B2B permissions work correctly

## Troubleshooting

### Common Issues
1. **Boolean mode not available**: Check user's B2B access permissions
2. **Invalid expression**: Ensure all conditions have valid field/operator combinations
3. **Preview fails**: Check that boolean expression is valid
4. **Query errors**: Verify field names match unified catalog

### Debug Tools
- Expression preview shows human-readable format
- Browser dev tools show component state
- Server logs show query generation
- Unit tests validate transformation logic 