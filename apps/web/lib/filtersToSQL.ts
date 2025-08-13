import { FIELD_EXPR_MAP_V1 } from './unifiedFieldCatalog';

// Very small rule grammar for demo purposes
export type Rule = { field: string; op: string; value: any };
export type FilterTree = { combinator?: 'and'|'or'; rules: Rule[] };

const sqlVal = (v:any) => {
  if (v === null) return 'NULL';
  if (typeof v === 'number') return `${v}`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const opToSql = (op:string, expr:string, value:any) => {
  switch (op) {
    case '=': case 'equals': return `${expr} = ${sqlVal(value)}`;
    case '!=': case 'does_not_contain': return `${expr} <> ${sqlVal(value)}`;
    case '>': case 'greater_than': return `${expr} > ${sqlVal(value)}`;
    case '<': case 'less_than': return `${expr} < ${sqlVal(value)}`;
    case '>=': return `${expr} >= ${sqlVal(value)}`;
    case '<=': return `${expr} <= ${sqlVal(value)}`;
    case 'contains': return `${expr} ILIKE '%' || ${sqlVal(value)} || '%'`;
    case 'starts_with': return `${expr} ILIKE ${sqlVal(String(value) + '%')}`;
    case 'ends_with': return `${expr} ILIKE ${sqlVal('%' + String(value))}`;
    case 'exists': return `${expr} IS NOT NULL`;
    case 'in': return `${expr} IN (${value.split(',').map((v: string) => sqlVal(v.trim())).join(', ')})`;
    default: return 'TRUE';
  }
};

export function compileFiltersToWhere(tree?: FilterTree) {
  if (!tree || !tree.rules?.length) return 'TRUE';
  const comb = (tree.combinator || 'and').toUpperCase();
  
  const clauses = tree.rules.map(r => {
    const expr = FIELD_EXPR_MAP_V1[r.field] || r.field;
    return opToSql(r.op, expr, r.value);
  });
  
  return clauses.length ? clauses.join(` ${comb} `) : 'TRUE';
}

// Keep the old function for backward compatibility
export function compilePixelFiltersToWhere(tree?: FilterTree) {
  return compileFiltersToWhere(tree);
} 