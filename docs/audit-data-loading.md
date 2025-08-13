# Audience Studio Data Loading Audit Report

## Executive Summary

This audit identifies all data reading methods in the Audience Studio repository, documenting endpoints, loaders, data destinations, and calling patterns. The system currently has **multiple overlapping data loading approaches** with significant duplication and inconsistency.

## Current Data Reading Methods

### 1. **Primary Data Loading Endpoints**

#### `/api/studio/audiences/select` (Main Entry Point)
- **File**: `apps/web/app/api/studio/audiences/select/route.ts`
- **Methods**: 
  - **Old format**: `{id, type}` → Creates test data
  - **New format**: `{url, format}` → Loads from GCS/local files
- **Loading Methods**:
  - `read_csv_auto()` for CSV files (line 212)
  - `read_parquet()` for Parquet files (line 207)
  - Test data generation for pixel/audience types (lines 23, 140)
- **Data Destination**: `studio_current` table
- **Field Mapping**: Uses `FIELD_CATALOG` from `lib/fieldCatalog.ts`
- **View Creation**: Creates `filters_attributes` view dynamically
- **Called By**: Studio UI when user selects audience

#### `/api/studio/load-data` (Alternative Loader)
- **File**: `apps/web/app/api/studio/load-data/route.ts`
- **Method**: Uses `duckDBService.loadData()` from `gcsLoader.ts`
- **Loading Methods**:
  - Downloads file to temp location via Google Cloud Storage SDK
  - Uses `read_csv_auto()` with local file path (line 44)
  - Alternative direct HTTPFS method available (line 112)
- **Data Destination**: `studio_current` table
- **Called By**: Legacy Studio components

#### `/api/studio/pixel/fetch-live` (Live API Integration)
- **File**: `apps/web/app/api/studio/pixel/fetch-live/route.ts`
- **Method**: Fetches from external API, inserts into DuckDB manually
- **Data Source**: External API at `https://v3-api-job-72802495918.us-east1.run.app`
- **Loading Method**: Manual INSERT statements for each event (lines 120-140)
- **Data Destination**: `pixel_events` table
- **Called By**: PixelPanels component for live data

### 2. **Supporting Data Setup Endpoints**

#### `/api/studio/setup-studio-current`
- **File**: `apps/web/app/api/studio/setup-studio-current/route.ts`
- **Method**: Copies data from `pixel_events` to `studio_current`
- **SQL**: `CREATE TABLE studio_current AS SELECT * FROM pixel_events;` (line 21)
- **Called By**: Studio setup process

#### `/api/studio/filters/setup`
- **File**: `apps/web/app/api/studio/filters/setup/route.ts`
- **Method**: Same as setup-studio-current (duplicate functionality)
- **SQL**: `CREATE TABLE studio_current AS SELECT * FROM pixel_events;` (line 10)
- **Called By**: Filter setup process

#### `/api/studio/test`
- **File**: `apps/web/app/api/studio/test/route.ts`
- **Method**: Creates test data with hardcoded values
- **SQL**: `CREATE TABLE studio_current AS SELECT ...` (line 25)
- **Data Destination**: `studio_current` table with test data
- **Called By**: Testing/debugging

### 3. **Data Querying Endpoints**

#### `/api/studio/preview` (Data Preview)
- **File**: `apps/web/app/api/studio/preview/route.ts`
- **Method**: Queries `studio_current` table with filters
- **Field Extraction**: Hardcoded resolution field extraction (lines 50-80)
- **Filtering**: Uses `compilePixelFiltersToWhere()` from `filtersToSQL.ts`
- **Called By**: Studio preview functionality

#### `/api/studio/query` (General Querying)
- **File**: `apps/web/app/api/studio/query/route.ts`
- **Method**: Uses `duckDBService.query()` with field mapping
- **Field Mapping**: Uses `getFieldExpression()` from `fieldCatalog.ts`
- **Called By**: Studio query functionality

### 4. **Legacy/Alternative Loaders**

#### PapaParse CSV Parser
- **File**: `apps/web/app/home/[account]/studio/utils/parseCSV.ts`
- **Method**: Uses PapaParse library for CSV parsing
- **Usage**: Client-side CSV parsing for file uploads
- **Called By**: Studio components for local file processing

#### JSON Loader
- **File**: `apps/web/app/lib/pixelDuck.ts`
- **Method**: Uses `read_json_auto()` for JSON files
- **SQL**: `FROM read_json_auto('${abs}', format='array', records=false)` (line 39)
- **Data Destination**: Custom table creation
- **Called By**: Pixel data loading

#### GCS Loader Service
- **File**: `apps/web/app/home/[account]/studio/utils/gcsLoader.ts`
- **Methods**:
  - `loadCSVFromGCS()` - Downloads to temp file, then loads (line 44)
  - `loadCSVFromGCSDirect()` - Direct HTTPFS loading (line 112)
- **Called By**: `duckDBService.loadData()`

## Data Flow Analysis

### Primary Data Flow
```
User selects audience → /api/studio/audiences/select → 
read_csv_auto/read_parquet → studio_current table → 
filters_attributes view → Query/Preview endpoints
```

### Alternative Data Flows
```
Live API → /api/studio/pixel/fetch-live → pixel_events table → 
/api/studio/setup-studio-current → studio_current table
```

```
GCS File → /api/studio/load-data → duckDBService → 
gcsLoader → studio_current table
```

## Identified Issues

### 1. **Duplicate Functionality**
- Multiple endpoints creating `studio_current` table
- Overlapping CSV loading methods (PapaParse vs DuckDB)
- Duplicate setup endpoints (`setup-studio-current` vs `filters/setup`)

### 2. **Inconsistent Data Sources**
- Google Cloud Storage URLs
- Local file paths
- External API endpoints
- Test data generation
- Manual INSERT statements

### 3. **Multiple Field Catalog Systems**
- `lib/fieldCatalog.ts` - Main field definitions
- `studio/utils/fieldCatalog.ts` - Duplicate with slight differences
- `lib/filterAttributesCatalog.ts` - Event and resolution field mappings
- Hardcoded field extraction in preview endpoint

### 4. **Inconsistent Loading Methods**
- Direct DuckDB `read_csv_auto()` vs Google Cloud Storage SDK download
- Manual INSERT statements vs bulk loading
- Test data generation vs real data loading

## Recommendations

### **Recommended Single Loader: `/api/studio/audiences/select`**

**Why this should remain:**
- Most comprehensive implementation
- Supports both CSV and Parquet formats
- Handles both old and new data formats
- Dynamic field mapping
- Proper error handling and timeouts
- Creates unified `filters_attributes` view

**Implementation:**
```typescript
// Recommended approach
export async function POST(request: NextRequest) {
  const { url, format } = await request.json();
  
  const con = getConn();
  const loadSQL = format === 'parquet'
    ? `CREATE OR REPLACE TABLE studio_current AS SELECT * FROM read_parquet('${url}')`
    : `CREATE OR REPLACE TABLE studio_current AS SELECT * FROM read_csv_auto('${url}', header=true)`;
    
  await con.run(loadSQL);
  
  // Create unified view using single field catalog
  const viewSQL = createUnifiedFiltersView();
  await con.run(viewSQL);
  
  return { success: true, tableName: 'studio_current' };
}
```

### **Endpoints to Delete/Merge**

#### **Delete:**
- `/api/studio/load-data` - Functionality covered by `/api/studio/audiences/select`
- `/api/studio/filters/setup` - Duplicate of `setup-studio-current`
- `/api/studio/test` - Move test data generation into main endpoint

#### **Merge:**
- `/api/studio/setup-studio-current` - Merge into `/api/studio/audiences/select`
- `/api/studio/pixel/fetch-live` - Integrate live API loading into main endpoint

#### **Refactor:**
- `/api/studio/preview` - Remove hardcoded field extraction, use unified field catalog
- `/api/studio/query` - Ensure consistent field mapping

### **Unified Field Catalog**

Consolidate all field definitions into one file:
```typescript
// lib/unifiedFieldCatalog.ts
export const UNIFIED_FIELD_CATALOG: FieldDefinition[] = [
  // All field definitions in one place
];

export function createUnifiedFiltersView(): string {
  // Generate view SQL from unified catalog
}
```

## Migration Plan

### Phase 1: Consolidate Field Catalogs
1. Create `lib/unifiedFieldCatalog.ts`
2. Update all imports to use unified catalog
3. Remove duplicate field catalog files

### Phase 2: Unify Data Loading
1. Enhance `/api/studio/audiences/select` to handle all data sources
2. Deprecate `/api/studio/load-data`
3. Merge setup endpoints into main endpoint

### Phase 3: Standardize Querying
1. Update preview and query endpoints to use unified field catalog
2. Remove hardcoded field extraction
3. Implement consistent error handling

### Phase 4: Clean Up
1. Remove duplicate files and functions
2. Update documentation
3. Add comprehensive testing

## Testing Requirements

### Endpoints to Test
1. `/api/studio/audiences/select` - Data loading from GCS
2. `/api/studio/preview` - Data preview with filters
3. `/api/studio/query` - General querying
4. `/api/studio/pixel/fetch-live` - Live data integration

### Test Data
```bash
# Test CSV loading
curl -X POST http://localhost:3000/api/studio/audiences/select \
  -H "Content-Type: application/json" \
  -d '{"url": "https://storage.googleapis.com/test-bucket/sample.csv", "format": "csv"}'

# Test preview with filters
curl -X POST http://localhost:3000/api/studio/preview \
  -H "Content-Type: application/json" \
  -d '{"filterTree": {"rules": [{"field": "pixel_id", "op": "=", "value": "test"}]}}'
```

## Conclusion

The Audience Studio has **multiple overlapping data loading methods** that need consolidation. The recommended approach is to:

1. **Keep**: `/api/studio/audiences/select` as the single data loading endpoint
2. **Delete**: Duplicate endpoints (`/api/studio/load-data`, `/api/studio/filters/setup`)
3. **Merge**: Setup endpoints into main endpoint
4. **Unify**: Field catalog systems into single source of truth
5. **Standardize**: Query endpoints to use unified field mapping

This will eliminate duplication, provide consistent field definitions, and create a maintainable architecture for the Audience Studio backend. 