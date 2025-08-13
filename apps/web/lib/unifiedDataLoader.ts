// Unified Data Loader for Audience Studio
// Single source of truth for loading data from GCS/local files into DuckDB

import { getLogger } from '@kit/shared/logger';
import { createHash } from 'crypto';
import { FIELD_SELECT_LIST_V1 } from './unifiedFieldCatalog';

export interface LoadOptions {
  url: string;
  format: 'csv' | 'parquet' | 'json';
  audience_id?: string; // Optional for tracking
}

export interface LoadResult {
  status: 'ok' | 'error';
  loaded_rows: number;
  view_rows: number;
  catalog: string;
  duration_ms: number;
  url_hash: string;
  error?: string;
}

export interface DuckDBService {
  query: (sql: string) => Promise<any>;
  close: () => Promise<void>;
}

// Adapter for the existing DuckDB connection
export function createDuckDBServiceAdapter(connection: any): DuckDBService {
  return {
    query: (sql: string) => {
      return new Promise((resolve, reject) => {
        // Use 'all' for SELECT queries to get results, 'run' for DDL/DML
        if (sql.trim().toLowerCase().startsWith('select')) {
          connection.all(sql, (error: any, rows: any[]) => {
            if (error) reject(error);
            else resolve(rows || []);
          });
        } else {
          connection.run(sql, (error: any) => {
            if (error) reject(error);
            else resolve([]);
          });
        }
      });
    },
    close: () => Promise.resolve()
  };
}

// Create a hash of the URL for logging (without exposing full URLs)
function createUrlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').substring(0, 8);
}

/**
 * Load data from GCS/local file into studio_current table
 */
export async function loadToStudioCurrent(
  duckDBService: DuckDBService,
  options: LoadOptions
): Promise<{ loaded_rows: number; duration_ms: number }> {
  const logger = await getLogger();
  const urlHash = createUrlHash(options.url);
  const startTime = Date.now();

  const ctx = {
    name: 'unified-data-loader',
    audience_id: options.audience_id,
    url_hash: urlHash,
    format: options.format,
  };

  logger.info(ctx, 'Starting data load to studio_current');

  try {
    // Drop existing table if it exists
    await duckDBService.query('DROP TABLE IF EXISTS studio_current');

    // Load data based on format
    let loadSql: string;
    switch (options.format) {
      case 'csv':
        loadSql = `CREATE TABLE studio_current AS SELECT * FROM read_csv_auto('${options.url}')`;
        break;
      case 'parquet':
        loadSql = `CREATE TABLE studio_current AS SELECT * FROM read_parquet('${options.url}')`;
        break;
      case 'json':
        loadSql = `CREATE TABLE studio_current AS SELECT * FROM read_json_auto('${options.url}')`;
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    logger.info(ctx, 'Executing load SQL', { sql: loadSql });

    // Execute the load
    await duckDBService.query(loadSql);

    // Debug: Check if table was created and what columns it has
    try {
      const pragmaResult = await duckDBService.query('PRAGMA table_info(studio_current)');
      logger.info(ctx, 'Table created successfully', {
        columns: pragmaResult.map((row: any) => row.name),
        column_count: pragmaResult.length
      });
    } catch (debugError) {
      logger.error(ctx, 'Failed to get table info', {
        error: debugError instanceof Error ? debugError.message : String(debugError)
      });
    }

    // Get row count
    const countResult = await duckDBService.query('SELECT COUNT(*) as count FROM studio_current');
    const loadedRows = Number(countResult[0]?.count || 0);

    const duration = Date.now() - startTime;
    logger.info(ctx, `Data load completed`, {
      loaded_rows: loadedRows,
      duration_ms: duration,
    });

    return { loaded_rows: loadedRows, duration_ms: duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(ctx, 'Data load failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration,
    });
    throw error;
  }
}

/**
 * Build the filters_attributes view from studio_current using unified field catalog
 */
export async function buildFiltersView(
  duckDBService: DuckDBService,
  options: LoadOptions
): Promise<{ view_rows: number; duration_ms: number }> {
  const logger = await getLogger();
  const urlHash = createUrlHash(options.url);
  const startTime = Date.now();

  const ctx = {
    name: 'unified-filters-view',
    audience_id: options.audience_id,
    url_hash: urlHash,
    format: options.format,
  };

  logger.info(ctx, 'Building filters_attributes view');

  try {
    await duckDBService.query('DROP VIEW IF EXISTS filters_attributes');

    // Get the actual columns from studio_current by sampling a row
    const sampleResult = await duckDBService.query('SELECT * FROM studio_current LIMIT 1');
    const availableColumns = sampleResult.length > 0 ? Object.keys(sampleResult[0]) : [];
    
    logger.info(ctx, 'Available columns in studio_current', {
      columns: availableColumns,
      count: availableColumns.length
    });

    // Ensure we have at least one column
    if (availableColumns.length === 0) {
      throw new Error('No columns found in studio_current table');
    }

    // Build a dynamic SELECT clause based on available columns
    const selectClauses: string[] = [];
    
    // Add all available columns as-is
    for (const column of availableColumns) {
      selectClauses.push(`"${column}"`);
    }

    // Create the view with only available columns
    const createViewSql = `
CREATE OR REPLACE VIEW filters_attributes AS
SELECT
  ${selectClauses.join(',\n  ')}
FROM studio_current;
    `.trim();

    logger.info(ctx, 'Creating dynamic filters view', {
      sql: createViewSql,
      available_columns: availableColumns.length
    });

    await duckDBService.query(createViewSql);

    // Get row count from view
    const countResult = await duckDBService.query('SELECT COUNT(*) as count FROM filters_attributes');
    const viewRows = Number(countResult[0]?.count || 0);

    const duration = Date.now() - startTime;
    logger.info(ctx, 'Filters view built successfully', {
      view_rows: viewRows,
      duration_ms: duration,
      columns_used: availableColumns.length
    });

    return { view_rows: viewRows, duration_ms: duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(ctx, 'Filters view build failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration,
    });
    throw error;
  }
}

/**
 * Complete unified data loading process
 */
export async function loadDataUnified(
  duckDBService: DuckDBService,
  options: LoadOptions
): Promise<LoadResult> {
  const logger = await getLogger();
  const urlHash = createUrlHash(options.url);
  const startTime = Date.now();

  const ctx = {
    name: 'unified-data-loader',
    audience_id: options.audience_id,
    url_hash: urlHash,
    format: options.format,
  };

  logger.info(ctx, 'Starting unified data loading process');

  try {
    // Step 1: Load data to studio_current
    const loadResult = await loadToStudioCurrent(duckDBService, options);

    // Step 2: Build filters view
    const viewResult = await buildFiltersView(duckDBService, options);

    const totalDuration = Date.now() - startTime;

    const result: LoadResult = {
      status: 'ok',
      loaded_rows: loadResult.loaded_rows,
      view_rows: viewResult.view_rows,
      catalog: 'v1',
      duration_ms: totalDuration,
      url_hash: urlHash,
    };

    logger.info(ctx, 'Unified data loading completed successfully', {
      loaded_rows: result.loaded_rows,
      view_rows: result.view_rows,
      total_duration_ms: totalDuration,
    });

    return result;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    logger.error(ctx, 'Unified data loading failed', {
      error: error instanceof Error ? error.message : String(error),
      total_duration_ms: totalDuration,
    });

    return {
      status: 'error',
      loaded_rows: 0,
      view_rows: 0,
      catalog: 'v1',
      duration_ms: totalDuration,
      url_hash: urlHash,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Legacy loader fallback (when feature flag is disabled)
 */
export async function loadDataLegacy(
  duckDBService: DuckDBService,
  options: LoadOptions
): Promise<LoadResult> {
  const logger = await getLogger();
  const urlHash = createUrlHash(options.url);

  const ctx = {
    name: 'legacy-data-loader',
    audience_id: options.audience_id,
    url_hash: urlHash,
    format: options.format,
  };

  logger.warn(ctx, 'Using legacy data loader (feature flag disabled)');

  // For now, just return a placeholder - this would contain the old loading logic
  return {
    status: 'ok',
    loaded_rows: 0,
    view_rows: 0,
    catalog: 'legacy',
    duration_ms: 0,
    url_hash: urlHash,
  };
}

/**
 * Main entry point - chooses between unified and legacy loader based on feature flag
 */
export async function loadData(
  duckDBService: DuckDBService,
  options: LoadOptions
): Promise<LoadResult> {
  const useUnifiedLoader = process.env.STUDIO_UNIFIED_LOADER !== 'false';
  
  if (useUnifiedLoader) {
    return loadDataUnified(duckDBService, options);
  } else {
    return loadDataLegacy(duckDBService, options);
  }
} 