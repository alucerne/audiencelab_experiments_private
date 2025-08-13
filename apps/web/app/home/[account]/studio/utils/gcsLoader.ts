// gcsLoader.ts
import { Storage } from '@google-cloud/storage';
import { Database } from 'duckdb';

export interface GCSLoaderOptions {
  bucketUrl: string;
  tableName?: string;
  tempDir?: string;
}

export interface LoadResult {
  success: boolean;
  tableName: string;
  rowCount: number;
  error?: string;
}

/**
 * Load CSV data from Google Cloud Storage into DuckDB
 */
export async function loadCSVFromGCS(
  db: Database,
  options: GCSLoaderOptions
): Promise<LoadResult> {
  const { bucketUrl, tableName = 'studio_current', tempDir = '/tmp' } = options;

  try {
    // Parse the GCS URL to extract bucket and file path
    const url = new URL(bucketUrl);
    const bucketName = url.hostname;
    const filePath = url.pathname.substring(1); // Remove leading slash

    // Initialize Google Cloud Storage
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Download the file to a temporary location
    const tempFilePath = `${tempDir}/studio_${Date.now()}.csv`;
    await file.download({ destination: tempFilePath });

    // Load the CSV into DuckDB
    const loadSQL = `
      CREATE OR REPLACE TABLE ${tableName} AS 
      SELECT * FROM read_csv_auto('${tempFilePath}', header=true, auto_detect=true)
    `;

    await db.exec(loadSQL);

    // Get row count
    const countResult = await db.all(`SELECT COUNT(*) as count FROM ${tableName}`);
    const rowCount = countResult[0]?.count || 0;

    // Create the filters_attributes view
    const { createFiltersAttributesViewSQL } = await import('./fieldCatalog');
    const viewSQL = createFiltersAttributesViewSQL();
    await db.exec(viewSQL);

    return {
      success: true,
      tableName,
      rowCount,
    };
  } catch (error) {
    console.error('Error loading CSV from GCS:', error);
    return {
      success: false,
      tableName,
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Initialize DuckDB with HTTPFS extension for GCS access
 */
export async function initializeDuckDB(): Promise<Database> {
  const db = new Database(':memory:');
  
  try {
    // Load HTTPFS extension for GCS access
    await db.exec("INSTALL httpfs");
    await db.exec("LOAD httpfs");
    
    // Configure HTTPFS for GCS
    await db.exec("SET s3_region='us-central1'");
    await db.exec("SET s3_url_style='path'");
    
    return db;
  } catch (error) {
    console.error('Error initializing DuckDB:', error);
    throw error;
  }
}

/**
 * Load CSV directly from GCS using HTTPFS (alternative method)
 */
export async function loadCSVFromGCSDirect(
  db: Database,
  options: GCSLoaderOptions
): Promise<LoadResult> {
  const { bucketUrl, tableName = 'studio_current' } = options;

  try {
    // Convert GCS URL to S3-compatible format
    const s3Url = bucketUrl.replace('storage.cloud.google.com', 'storage.googleapis.com');
    
    // Load CSV directly using HTTPFS
    const loadSQL = `
      CREATE OR REPLACE TABLE ${tableName} AS 
      SELECT * FROM read_csv_auto('${s3Url}', header=true, auto_detect=true)
    `;

    await db.exec(loadSQL);

    // Get row count
    const countResult = await db.all(`SELECT COUNT(*) as count FROM ${tableName}`);
    const rowCount = countResult[0]?.count || 0;

    // Create the filters_attributes view
    const { createFiltersAttributesViewSQL } = await import('./fieldCatalog');
    const viewSQL = createFiltersAttributesViewSQL();
    await db.exec(viewSQL);

    return {
      success: true,
      tableName,
      rowCount,
    };
  } catch (error) {
    console.error('Error loading CSV from GCS directly:', error);
    return {
      success: false,
      tableName,
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 