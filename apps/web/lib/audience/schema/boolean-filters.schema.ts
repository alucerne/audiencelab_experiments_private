import { z } from 'zod';
import { FIELD_REGISTRY, getFieldByKey, getOperatorsForField, getValueTypeForField, getEnumValuesForField, ValueType } from './field-registry';

export type FilterMode = 'simple' | 'boolean';

export type Condition = {
  kind: 'condition';
  category: 'intent'|'date'|'business'|'financial'|'personal'|'family'|'housing'|'location'|'contact';
  field: string;   // fully-qualified field key, e.g. "business.employee_count", "location.geo_radius_km"
  op: string;      // operator id (must exist for field in registry)
  value: unknown;  // typed/validated per field/operator
  not?: boolean;
};

export type Group = {
  kind: 'group';
  op: 'AND' | 'OR';
  not?: boolean;
  children: Array<Group | Condition>;
};

export type BooleanExpression = Group;

export type AudienceFilters = {
  mode?: FilterMode;              // default 'simple'
  simple?: Record<string, any>;   // legacy structure
  boolean?: { expression: BooleanExpression } | null;
};

// Dynamic value validation based on field registry
const zValueByType = (fieldKey: string) => {
  const field = getFieldByKey(fieldKey);
  if (!field) return z.any();

  const valueType = field.valueType;
  
  switch (valueType) {
    case 'string': 
      return z.string();
    case 'string[]': 
      return z.array(z.string()).nonempty();
    case 'number': 
      return z.number();
    case 'number[]': 
      return z.array(z.number()).nonempty();
    case 'numberRange': 
      return z.tuple([z.number(), z.number()]).refine(
        ([min, max]) => min <= max, 
        'Min value must be less than or equal to max value'
      );
    case 'enum': 
      return z.string().refine(
        v => field.enumValues?.includes(v) ?? true, 
        'Invalid enum value'
      );
    case 'enum[]': 
      return z.array(z.string().refine(
        v => field.enumValues?.includes(v) ?? true, 
        'Invalid enum value'
      )).nonempty();
    case 'boolean': 
      return z.boolean();
    case 'date': 
      return z.string(); // ISO date string
    case 'dateRange': 
      return z.tuple([z.string(), z.string()]).refine(
        ([from, to]) => new Date(from) <= new Date(to), 
        'Start date must be before or equal to end date'
      );
    case 'geoPoint': 
      return z.object({ 
        lat: z.number().min(-90).max(90), 
        lng: z.number().min(-180).max(180) 
      });
    case 'geoRadius': 
      return z.object({ 
        lat: z.number().min(-90).max(90), 
        lng: z.number().min(-180).max(180), 
        radiusKm: z.number().positive() 
      });
    default: 
      return z.any();
  }
};

// Dynamic operator validation based on field registry
const zOperatorForField = (fieldKey: string) => {
  const operators = getOperatorsForField(fieldKey);
  return z.enum(operators as [string, ...string[]]);
};

export const zCondition = z.object({
  kind: z.literal('condition'),
  category: z.enum(['intent', 'date', 'business', 'financial', 'personal', 'family', 'housing', 'location', 'contact']),
  field: z.string().refine(
    key => getFieldByKey(key) !== undefined, 
    'Unknown field'
  ),
  op: z.string(),
  value: z.any(),
  not: z.boolean().optional()
}).superRefine((val, ctx) => {
  // Validate operator against field
  const operators = getOperatorsForField(val.field);
  if (!operators.includes(val.op as any)) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: `Operator '${val.op}' not allowed for field '${val.field}'` 
    });
  }
  
  // Validate value against field type
  try {
    const valueSchema = zValueByType(val.field);
    valueSchema.parse(val.value);
  } catch (e: any) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: `Invalid value for field ${val.field}: ${e.message}` 
    });
  }
});

export const zGroup: z.ZodType<Group> = z.lazy(() => {
  const zGroupRecursive: z.ZodType<Group> = z.object({
    kind: z.literal('group'),
    op: z.enum(['AND', 'OR']),
    not: z.boolean().optional(),
    children: z.array(z.union([zCondition, zGroupRecursive]))
  });
  return zGroupRecursive;
});

export const zBooleanExpression = zGroup;

export const zAudienceFilters = z.object({
  mode: z.enum(['simple', 'boolean']).optional(),
  simple: z.record(z.any()).optional(),
  boolean: z
    .object({
      expression: zBooleanExpression
    })
    .nullable()
    .optional()
});

export const defaultBooleanExpression: BooleanExpression = {
  kind: 'group',
  op: 'AND',
  children: []
}; 