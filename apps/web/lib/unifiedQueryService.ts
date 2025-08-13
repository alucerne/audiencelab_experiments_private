import { getLogger } from '@kit/shared/logger';
import { FIELD_EXPR_MAP_V1, FIELD_TYPE_MAP_V1 } from './unifiedFieldCatalog';
import { DuckDBService } from './unifiedDataLoader';

export interface FilterRule {
  field: string;
  op: string;
  value?: any;
}

export interface FilterTree {
  combinator: 'and' | 'or';
  rules: (FilterRule | FilterTree)[];
}

export interface PreviewOptions {
  limit: number;
  offset: number;
  where?: any;
  select?: string[]; // Optional column selection
}

export interface PreviewResult {
  rows: any[];
  limit: number;
  offset: number;
  total_rows?: number;
}

export interface DuckDBService {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

/**
 * Compile a filter tree into a SQL WHERE clause
 */
export function compileWhere(
  filterTree: FilterTree | FilterRule,
  fieldExprMap: Record<string, string>,
  fieldTypeMap: Record<string, string>
): string {
  const logger = getLogger();

  function compileRule(rule: FilterRule): string {
    const { field, op, value } = rule;
    
    // Get the field expression from the map
    const fieldExpr = fieldExprMap[field];
    if (!fieldExpr) {
      logger.warn({ field }, 'Unknown field in filter rule');
      return '1=0'; // Invalid field = no results
    }

    const fieldType = fieldTypeMap[field] || 'string';
    
    // Handle different operators
    switch (op) {
      case '=':
        if (value === null || value === undefined) {
          return `${fieldExpr} IS NULL`;
        }
        if (fieldType === 'string') {
          return `${fieldExpr} = '${escapeString(value)}'`;
        }
        return `${fieldExpr} = ${value}`;
        
      case '!=':
        if (value === null || value === undefined) {
          return `${fieldExpr} IS NOT NULL`;
        }
        if (fieldType === 'string') {
          return `${fieldExpr} != '${escapeString(value)}'`;
        }
        return `${fieldExpr} != ${value}`;
        
      case '>':
        return `${fieldExpr} > ${value}`;
        
      case '<':
        return `${fieldExpr} < ${value}`;
        
      case '>=':
        return `${fieldExpr} >= ${value}`;
        
      case '<=':
        return `${fieldExpr} <= ${value}`;
        
      case 'contains':
        return `${fieldExpr} LIKE '%${escapeString(value)}%'`;
        
      case 'startsWith':
      case 'starts_with':
        return `${fieldExpr} LIKE '${escapeString(value)}%'`;
        
      case 'endsWith':
      case 'ends_with':
        return `${fieldExpr} LIKE '%${escapeString(value)}'`;
        
      case 'isNull':
        return `${fieldExpr} IS NULL`;
        
      case 'notNull':
        return `${fieldExpr} IS NOT NULL`;
        
      case 'exists':
        return `${fieldExpr} IS NOT NULL AND ${fieldExpr} != ''`;
        
      default:
        logger.warn({ op, field }, 'Unknown operator in filter rule');
        return '1=0'; // Invalid operator = no results
    }
  }

  function compileTree(tree: FilterTree | FilterRule): string {
    if ('field' in tree) {
      // It's a FilterRule
      return compileRule(tree);
    }
    
    // It's a FilterTree
    const { combinator, rules } = tree;
    
    if (rules.length === 0) {
      return '1=1'; // Empty tree = all results
    }
    
    if (rules.length === 1) {
      return compileTree(rules[0]);
    }
    
    const compiledRules = rules.map(compileTree);
    const operator = combinator.toUpperCase();
    
    return `(${compiledRules.join(` ${operator} `)})`;
  }

  return compileTree(filterTree);
}

/**
 * Escape single quotes in string values for SQL
 */
function escapeString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Convert BigInt values to regular numbers for JSON serialization
 */
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}

/**
 * Run a preview query with filters
 */
export async function runPreview(
  duckDBService: DuckDBService, 
  options: PreviewOptions
): Promise<{ rows: any[]; limit: number; offset: number }> {
  const { limit, offset, where, select } = options;
  
  // Build SELECT clause
  const selectClause = select && select.length > 0
    ? select.map(field => `"${field}"`).join(', ')
    : '*';

  // Build WHERE clause
  const whereClause = where ? compileWhere(where, FIELD_EXPR_MAP_V1, FIELD_TYPE_MAP_V1) : '1=1';
  
  const sql = `
    SELECT ${selectClause}
    FROM filters_attributes
    WHERE ${whereClause}
    LIMIT ${Math.min(1000, limit)}
    OFFSET ${Math.max(0, offset)}
  `;

  try {
    const rows = await duckDBService.query(sql);
    const convertedRows = convertBigInts(rows);
    
    return {
      rows: convertedRows,
      limit: Math.min(1000, limit),
      offset: Math.max(0, offset)
    };
  } catch (error) {
    throw new Error(`Preview query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get total row count for pagination
 */
export async function getTotalCount(
  duckDBService: DuckDBService,
  where?: FilterTree
): Promise<number> {
  const logger = await getLogger();
  
  const ctx = {
    name: 'unified-query-count',
    has_where: !!where,
  };

  try {
    let sql = 'SELECT COUNT(*) as count FROM filters_attributes';
    
    if (where) {
      const whereClause = compileWhere(where, FIELD_EXPR_MAP_V1, FIELD_TYPE_MAP_V1);
      sql += ` WHERE ${whereClause}`;
    }

    logger.info(ctx, 'Executing count query', { sql });

    const result = await duckDBService.query(sql);
    const totalRows = Number(result[0]?.count || 0);

    logger.info(ctx, 'Count query completed', { total_rows: totalRows });

    return totalRows;
  } catch (error) {
    logger.error(ctx, 'Count query failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
} 