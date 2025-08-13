import { BooleanExpression, Condition, Group } from './schema/boolean-filters.schema';
import { getFieldByKey, getOperatorsForField, getValueTypeForField } from './schema/field-registry';

type PgBuild = { clause: string; params: any[] };
type PgResult = { clause: string; params: any[] };

// Map condition to Postgres query
function mapConditionToPg(condition: Condition): PgBuild[] {
  const field = getFieldByKey(condition.field);
  if (!field) {
    console.warn(`Unknown field: ${condition.field}`);
    return [{ clause: 'TRUE', params: [] }];
  }

  const { op, value } = condition;
  const fieldKey = field.pgMapper;

  // Handle different operators
  switch (op) {
    case 'eq':
      return [{ clause: `${fieldKey} = $1`, params: [value] }];
    
    case 'neq':
      return [{ clause: `${fieldKey} != $1`, params: [value] }];
    
    case 'in':
      if (Array.isArray(value)) {
        const placeholders = value.map((_, i) => `$${i + 1}`).join(', ');
        return [{ clause: `${fieldKey} IN (${placeholders})`, params: value }];
      }
      return [{ clause: `${fieldKey} = $1`, params: [value] }];
    
    case 'nin':
      if (Array.isArray(value)) {
        const placeholders = value.map((_, i) => `$${i + 1}`).join(', ');
        return [{ clause: `${fieldKey} NOT IN (${placeholders})`, params: value }];
      }
      return [{ clause: `${fieldKey} != $1`, params: [value] }];
    
    case 'contains':
      return [{ clause: `${fieldKey} ILIKE $1`, params: [`%${value}%`] }];
    
    case 'icontains':
      return [{ clause: `${fieldKey} ILIKE $1`, params: [`%${value}%`] }];
    
    case 'starts_with':
      return [{ clause: `${fieldKey} ILIKE $1`, params: [`${value}%`] }];
    
    case 'ends_with':
      return [{ clause: `${fieldKey} ILIKE $1`, params: [`%${value}`] }];
    
    case 'gte':
      return [{ clause: `${fieldKey} >= $1`, params: [value] }];
    
    case 'lte':
      return [{ clause: `${fieldKey} <= $1`, params: [value] }];
    
    case 'gt':
      return [{ clause: `${fieldKey} > $1`, params: [value] }];
    
    case 'lt':
      return [{ clause: `${fieldKey} < $1`, params: [value] }];
    
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return [{ clause: `${fieldKey} BETWEEN $1 AND $2`, params: value }];
      }
      return [{ clause: 'TRUE', params: [] }];
    
    case 'exists':
      return [{ clause: `${fieldKey} IS NOT NULL`, params: [] }];
    
    case 'notExists':
      return [{ clause: `${fieldKey} IS NULL`, params: [] }];
    
    case 'isTrue':
      return [{ clause: `${fieldKey} = true`, params: [] }];
    
    case 'isFalse':
      return [{ clause: `${fieldKey} = false`, params: [] }];
    
    case 'withinRadius':
      // Handle geo radius - this would need to be implemented based on your geo setup
      if (typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value && 'radiusKm' in value) {
        const geoValue = value as { lat: number; lng: number; radiusKm: number };
        // Example: ST_DWithin(geometry, ST_Point($2, $1), $3 * 1000)
        return [{ 
          clause: `ST_DWithin(${fieldKey}, ST_Point($2, $1), $3 * 1000)`, 
          params: [geoValue.lat, geoValue.lng, geoValue.radiusKm] 
        }];
      }
      return [{ clause: 'TRUE', params: [] }];
    
    default:
      console.warn(`Unknown operator: ${op} for field: ${condition.field}`);
      return [{ clause: 'TRUE', params: [] }];
  }
}

// Map condition to Typesense filter
function mapConditionToTypesense(condition: Condition): string {
  const field = getFieldByKey(condition.field);
  if (!field || !field.typesenseMapper) {
    return ''; // Not applicable for Typesense
  }

  const { op, value } = condition;
  const fieldKey = field.typesenseMapper;

  // Handle different operators for Typesense
  switch (op) {
    case 'eq':
      return `${fieldKey}:=${value}`;
    
    case 'neq':
      return `${fieldKey}:!=${value}`;
    
    case 'in':
      if (Array.isArray(value)) {
        return `${fieldKey}:[${value.join(', ')}]`;
      }
      return `${fieldKey}:=${value}`;
    
    case 'nin':
      if (Array.isArray(value)) {
        return `!${fieldKey}:[${value.join(', ')}]`;
      }
      return `${fieldKey}:!=${value}`;
    
    case 'contains':
      return `${fieldKey}:${value}`;
    
    case 'icontains':
      return `${fieldKey}:${value}`;
    
    case 'starts_with':
      return `${fieldKey}:${value}*`;
    
    case 'ends_with':
      return `${fieldKey}:*${value}`;
    
    case 'gte':
      return `${fieldKey}:>=${value}`;
    
    case 'lte':
      return `${fieldKey}:<=${value}`;
    
    case 'gt':
      return `${fieldKey}:>${value}`;
    
    case 'lt':
      return `${fieldKey}:<${value}`;
    
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return `${fieldKey}:[${value[0]}..${value[1]}]`;
      }
      return '';
    
    case 'exists':
      return `${fieldKey}:!=''`;
    
    case 'notExists':
      return `${fieldKey}:=''`;
    
    case 'isTrue':
      return `${fieldKey}:=true`;
    
    case 'isFalse':
      return `${fieldKey}:=false`;
    
    case 'match':
      return `${fieldKey}:${value}`;
    
    case 'matchAny':
      if (Array.isArray(value)) {
        return `${fieldKey}:${value.join(' || ')}`;
      }
      return `${fieldKey}:${value}`;
    
    case 'withinRadius':
      // Typesense geo filter - implement based on your Typesense geo setup
      if (typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value && 'radiusKm' in value) {
        const geoValue = value as { lat: number; lng: number; radiusKm: number };
        return `${fieldKey}:[${geoValue.lat}, ${geoValue.lng}, ${geoValue.radiusKm}km]`;
      }
      return '';
    
    default:
      console.warn(`Unknown Typesense operator: ${op} for field: ${condition.field}`);
      return '';
  }
}

// Build Postgres query recursively
function buildPg(node: Group | Condition): PgResult {
  if (node.kind === 'condition') {
    const parts: PgBuild[] = mapConditionToPg(node);
    const body = parts.map(p => `(${p.clause})`).join(' AND ') || 'TRUE';
    const notWrapped = node.not ? `NOT (${body})` : body;
    return { clause: notWrapped, params: parts.flatMap(p => p.params) };
  }

  const children = node.children.map(buildPg);
  const joined = children.map(c => `(${c.clause})`).join(` ${node.op} `) || 'TRUE';
  const final = node.not ? `NOT (${joined})` : joined;
  return { clause: final, params: children.flatMap(c => c.params) };
}

// Build Typesense filter recursively
function buildTypesense(node: Group | Condition): string {
  if (node.kind === 'condition') {
    const s = mapConditionToTypesense(node) || '';
    const body = s ? `(${s})` : ''; // allow non-TS fields
    return node.not && body ? `!${body}` : body || '(*:*)';
  }

  const parts = node.children.map(buildTypesense).filter(Boolean);
  const joiner = node.op === 'AND' ? ' && ' : ' || ';
  const inner = parts.length ? parts.join(joiner) : '(*:*)';
  return node.not ? `!(${inner})` : `(${inner})`;
}

// Main export function
export function booleanToQueries(expr: BooleanExpression) {
  const pg = buildPg(expr);
  const ts = buildTypesense(expr);
  return { pgWhere: pg.clause, pgParams: pg.params, typesenseFilter: ts };
}

// Helper functions for UI
export function isB2BField(field: string): boolean {
  const fieldDef = getFieldByKey(field);
  return fieldDef?.category === 'business';
}

export function getFieldOperators(field: string): string[] {
  return getOperatorsForField(field);
}

export function getFieldType(field: string): 'string' | 'number' | 'array' {
  const valueType = getValueTypeForField(field);
  switch (valueType) {
    case 'string':
    case 'enum':
      return 'string';
    case 'number':
    case 'numberRange':
      return 'number';
    case 'string[]':
    case 'number[]':
    case 'enum[]':
      return 'array';
    default:
      return 'string';
  }
} 