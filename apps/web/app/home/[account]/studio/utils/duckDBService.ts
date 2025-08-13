// duckDBService.ts
import { Database } from 'duckdb';
import { initializeDuckDB, loadCSVFromGCS, LoadResult } from './gcsLoader';
import { FIELD_CATALOG, getFieldExpression } from './fieldCatalog';

export interface QueryOptions {
  selectedFields?: string[];
  filters?: Filter[];
  limit?: number;
  offset?: number;
}

export interface Filter {
  field: string;
  operator: string;
  value: string;
}

export interface QueryResult {
  success: boolean;
  data: any[];
  totalCount: number;
  error?: string;
}

export interface Segment {
  id: string;
  name: string;
  sql: string;
  selectedFields: string[];
  filters: Filter[];
  created_at: string;
  account_id: string;
}

class DuckDBService {
  private db: Database | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await initializeDuckDB();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize DuckDB:', error);
      throw error;
    }
  }

  async loadData(bucketUrl: string): Promise<LoadResult> {
    if (!this.db) {
      throw new Error('DuckDB not initialized');
    }

    return await loadCSVFromGCS(this.db, { bucketUrl });
  }

  async query(options: QueryOptions): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('DuckDB not initialized');
    }

    try {
      const { selectedFields = [], filters = [], limit = 100, offset = 0 } = options;

      // Build SELECT clause
      const selectClause = selectedFields.length > 0 
        ? selectedFields.map(field => getFieldExpression(field)).join(', ')
        : '*';

      // Build WHERE clause
      const whereConditions = filters.map(filter => {
        const fieldExpr = getFieldExpression(filter.field);
        const { operator, value } = filter;

        switch (operator) {
          case '=':
            return `${fieldExpr} = '${value}'`;
          case '!=':
            return `${fieldExpr} != '${value}'`;
          case '>':
            return `${fieldExpr} > ${value}`;
          case '<':
            return `${fieldExpr} < ${value}`;
          case '>=':
            return `${fieldExpr} >= ${value}`;
          case '<=':
            return `${fieldExpr} <= ${value}`;
          case 'contains':
            return `${fieldExpr} LIKE '%${value}%'`;
          case 'starts_with':
            return `${fieldExpr} LIKE '${value}%'`;
          case 'ends_with':
            return `${fieldExpr} LIKE '%${value}'`;
          case 'exists':
            return `${fieldExpr} IS NOT NULL`;
          default:
            return `${fieldExpr} = '${value}'`;
        }
      });

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Build the complete query
      const query = `
        SELECT ${selectClause}
        FROM filters_attributes
        ${whereClause}
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Execute query
      const data = await this.db.all(query);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM filters_attributes
        ${whereClause}
      `;
      const countResult = await this.db.all(countQuery);
      const totalCount = countResult[0]?.total || 0;

      return {
        success: true,
        data,
        totalCount,
      };
    } catch (error) {
      console.error('Query error:', error);
      return {
        success: false,
        data: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTableInfo(): Promise<any> {
    if (!this.db) {
      throw new Error('DuckDB not initialized');
    }

    try {
      const result = await this.db.all("DESCRIBE studio_current");
      return result;
    } catch (error) {
      console.error('Error getting table info:', error);
      throw error;
    }
  }

  async getRowCount(): Promise<number> {
    if (!this.db) {
      throw new Error('DuckDB not initialized');
    }

    try {
      const result = await this.db.all("SELECT COUNT(*) as count FROM studio_current");
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting row count:', error);
      return 0;
    }
  }

  async createSegment(segment: Omit<Segment, 'id' | 'created_at'>): Promise<string> {
    if (!this.db) {
      throw new Error('DuckDB not initialized');
    }

    try {
      const segmentId = `segment_${Date.now()}`;
      
      // Create a view for this segment
      const { selectedFields, filters } = segment;
      const selectClause = selectedFields.length > 0 
        ? selectedFields.map(field => getFieldExpression(field)).join(', ')
        : '*';

      const whereConditions = filters.map(filter => {
        const fieldExpr = getFieldExpression(filter.field);
        const { operator, value } = filter;

        switch (operator) {
          case '=':
            return `${fieldExpr} = '${value}'`;
          case '!=':
            return `${fieldExpr} != '${value}'`;
          case '>':
            return `${fieldExpr} > ${value}`;
          case '<':
            return `${fieldExpr} < ${value}`;
          case '>=':
            return `${fieldExpr} >= ${value}`;
          case '<=':
            return `${fieldExpr} <= ${value}`;
          case 'contains':
            return `${fieldExpr} LIKE '%${value}%'`;
          case 'starts_with':
            return `${fieldExpr} LIKE '${value}%'`;
          case 'ends_with':
            return `${fieldExpr} LIKE '%${value}'`;
          case 'exists':
            return `${fieldExpr} IS NOT NULL`;
          default:
            return `${fieldExpr} = '${value}'`;
        }
      });

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const createViewSQL = `
        CREATE OR REPLACE VIEW ${segmentId} AS
        SELECT ${selectClause}
        FROM filters_attributes
        ${whereClause}
      `;

      await this.db.exec(createViewSQL);

      return segmentId;
    } catch (error) {
      console.error('Error creating segment:', error);
      throw error;
    }
  }

  async querySegment(segmentId: string, limit = 100, offset = 0): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('DuckDB not initialized');
    }

    try {
      const query = `
        SELECT *
        FROM ${segmentId}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const data = await this.db.all(query);

      const countQuery = `SELECT COUNT(*) as total FROM ${segmentId}`;
      const countResult = await this.db.all(countQuery);
      const totalCount = countResult[0]?.total || 0;

      return {
        success: true,
        data,
        totalCount,
      };
    } catch (error) {
      console.error('Error querying segment:', error);
      return {
        success: false,
        data: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export a singleton instance
export const duckDBService = new DuckDBService(); 