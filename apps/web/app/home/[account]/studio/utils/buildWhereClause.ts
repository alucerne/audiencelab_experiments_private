interface Filter {
  id: string;
  category: string;
  field: string;
  operator: string;
  value: string;
}

export function buildWhereClause(filters: Filter[]): string {
  if (!filters || filters.length === 0) return 'TRUE';

  const conditions = filters.map(filter => {
    const col = filter.field;
    const op = filter.operator;
    const val = filter.value;
    
    switch (op) {
      case 'equals':
        return `${col} = '${val.replace(/'/g, "''")}'`;
      case 'contains':
        return `${col} LIKE '%${val.replace(/'/g, "''")}%'`;
      case 'starts_with':
        return `${col} LIKE '${val.replace(/'/g, "''")}%'`;
      case 'ends_with':
        return `${col} LIKE '%${val.replace(/'/g, "''")}'`;
      case 'greater_than':
        // Handle numeric values
        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
          return `${col} > ${numVal}`;
        }
        return `${col} > '${val.replace(/'/g, "''")}'`;
      case 'less_than':
        // Handle numeric values
        const numVal2 = parseFloat(val);
        if (!isNaN(numVal2)) {
          return `${col} < ${numVal2}`;
        }
        return `${col} < '${val.replace(/'/g, "''")}'`;
      case 'in':
        // Handle comma-separated values
        const values = val.split(',').map(v => `'${v.trim().replace(/'/g, "''")}'`).join(',');
        return `${col} IN (${values})`;
      default:
        return `${col} = '${val.replace(/'/g, "''")}'`;
    }
  });

  return conditions.join(' AND ');
} 