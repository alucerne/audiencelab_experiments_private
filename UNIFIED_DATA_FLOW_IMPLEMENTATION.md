# Unified Pixel + Audience Data Flow Implementation

## Overview

This implementation provides a unified field system for both "Stage 1 – Querying" and "Stage 2 – Filtering" in Studio. It pulls data directly from Google Cloud Storage CSV files, loads them into DuckDB, and allows users to query and filter using the exact same set of fields.

## Architecture

### 1. Unified Field Catalog (`fieldCatalog.ts`)

The core of the system is a single field catalog that defines all possible fields for both pixel events and contact data:

```typescript
export interface FieldDefinition {
  key: string;        // unique field name
  label: string;      // UI display label
  type: FieldType;    // data type
  expr: string;       // DuckDB expression
  group: "pixel_event" | "contact";
}
```

**Key Features:**
- **Pixel Event Fields**: Direct column access and JSON extraction from `event_data`
- **Contact Data Fields**: Direct column access with proper type casting
- **JSON Field Support**: Uses `json_extract_string` and `json_extract` for nested data
- **Type Safety**: Proper TypeScript types for all field definitions

### 2. Google Storage Loader (`gcsLoader.ts`)

Handles loading CSV data from Google Cloud Storage into DuckDB:

```typescript
export async function loadCSVFromGCS(
  db: Database,
  options: GCSLoaderOptions
): Promise<LoadResult>
```

**Features:**
- Downloads CSV from GCS bucket
- Loads into DuckDB with auto-detection
- Creates `filters_attributes` view automatically
- Supports both direct download and HTTPFS methods

### 3. DuckDB Service (`duckDBService.ts`)

Manages all DuckDB operations including querying, filtering, and segment management:

```typescript
class DuckDBService {
  async query(options: QueryOptions): Promise<QueryResult>
  async createSegment(segment: Segment): Promise<string>
  async querySegment(segmentId: string): Promise<QueryResult>
}
```

**Features:**
- **Unified Querying**: Uses the same field expressions for all queries
- **Advanced Filtering**: Supports all SQL operators and pattern matching
- **Segment Management**: Creates and manages named segments
- **Pagination**: Built-in limit/offset support

### 4. API Endpoints

#### `/api/studio/filters/fields`
Returns the unified field catalog for UI components.

#### `/api/studio/load-data`
Loads CSV data from GCS into DuckDB.

#### `/api/studio/query`
Executes queries using the unified field system.

#### `/api/studio/segments`
Manages segment creation and retrieval.

## Implementation Details

### Field Catalog Structure

The field catalog includes:

**Pixel Event Fields:**
- Direct columns: `pixel_id`, `hem_sha256`, `event_timestamp`, etc.
- JSON extracted: `percentage`, `timestamp`, `url` from `event_data`

**Contact Data Fields:**
- Direct columns: `UUID`, `FIRST_NAME`, `LAST_NAME`, etc.
- Type-cast fields: `HOMEOWNER`, `MARRIED` as boolean
- Numeric fields: `INFERRED_YEARS_EXPERIENCE`, `COMPANY_EMPLOYEE_COUNT`

### DuckDB View Creation

The system automatically creates a `filters_attributes` view that maps all field expressions:

```sql
CREATE OR REPLACE VIEW filters_attributes AS
SELECT
  pixel_id,
  hem_sha256,
  CAST(event_timestamp AS TIMESTAMP) AS event_timestamp,
  json_extract_string(event_data, '$.url') AS url,
  CAST(json_extract(event_data, '$.percentage') AS DOUBLE) AS percentage,
  -- ... all other fields
FROM studio_current;
```

### Query Building

Queries are built using the field expressions:

```typescript
const selectClause = selectedFields.length > 0 
  ? selectedFields.map(field => getFieldExpression(field)).join(', ')
  : '*';

const whereConditions = filters.map(filter => {
  const fieldExpr = getFieldExpression(filter.field);
  // Build SQL condition based on operator
});
```

## UI Components

### 1. FieldSelector Component

New component for selecting fields from the unified catalog:

```typescript
<FieldSelector
  selectedFields={selectedFields}
  onFieldsChange={setSelectedFields}
  isPixelAudience={isPixelAudience}
/>
```

**Features:**
- Grouped by "Pixel Events" vs "Contact Data"
- Search functionality
- Select/Deselect all options
- Visual field type indicators

### 2. Updated Filters Component

Enhanced to use the unified field system:

```typescript
<Filters
  onChange={setFilters}
  isPixelAudience={isPixelAudience}
/>
```

**Features:**
- Uses unified field catalog
- Group-based field filtering
- Consistent operator support
- Real-time filter preview

## Database Schema

### Segments Table

The existing `segments` table is used to store segment metadata:

```sql
CREATE TABLE public.segments (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  name text NOT NULL,
  selected_fields text[] NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  -- ... other fields
);
```

## Testing

### Test Script

Run the comprehensive test suite:

```bash
./test-unified-data-flow.sh
```

**Test Coverage:**
1. **Load Test CSV**: Verify GCS loading works
2. **Field Catalog**: Verify unified field system
3. **Query Data**: Test basic querying
4. **Filter Data**: Test filtering functionality
5. **Save Segment**: Test segment creation
6. **Pixel-Specific Data**: Test JSON field extraction
7. **URL Pattern Matching**: Test pattern matching

### Manual Testing

1. **Load Data**: Use the test GCS URL
2. **Select Fields**: Choose fields from both groups
3. **Apply Filters**: Test various operators
4. **Save Segment**: Create and verify segments
5. **Reload Studio**: Verify persistence

## Security Considerations

### Row Level Security (RLS)

All database operations respect existing RLS policies:

```sql
-- Segments table RLS
CREATE POLICY select_segments ON public.segments
  FOR SELECT TO authenticated
  USING (public.has_role_on_account(account_id));
```

### Input Validation

- All field keys are validated against the catalog
- SQL injection prevention through parameterized queries
- Type checking for all field operations

## Performance Optimizations

### DuckDB Features

- **In-Memory Processing**: Fast query execution
- **Columnar Storage**: Efficient for analytics workloads
- **HTTPFS Extension**: Direct GCS access
- **View Optimization**: Pre-computed field expressions

### Caching Strategy

- **Field Catalog**: Cached in memory
- **Query Results**: Paginated to prevent memory issues
- **Segment Views**: Persistent in DuckDB

## Error Handling

### Graceful Degradation

- **GCS Unavailable**: Fallback to local CSV
- **DuckDB Errors**: Detailed error messages
- **Field Not Found**: Skip invalid fields
- **Query Timeout**: Return partial results

### Logging

- **Structured Logging**: All operations logged
- **Error Context**: Detailed error information
- **Performance Metrics**: Query execution times

## Future Enhancements

### Planned Features

1. **Real-time Updates**: Live data synchronization
2. **Advanced Analytics**: Aggregation functions
3. **Export Capabilities**: CSV/JSON export
4. **Visual Query Builder**: Drag-and-drop interface
5. **Caching Layer**: Redis integration
6. **Multi-table Support**: Join capabilities

### Scalability Improvements

1. **Connection Pooling**: Multiple DuckDB instances
2. **Data Partitioning**: Time-based partitioning
3. **Index Optimization**: Automatic index creation
4. **Query Optimization**: Cost-based optimization

## Deployment Checklist

### Prerequisites

- [ ] DuckDB installed and configured
- [ ] Google Cloud Storage credentials
- [ ] Supabase database with segments table
- [ ] Environment variables configured

### Configuration

- [ ] GCS bucket permissions
- [ ] DuckDB HTTPFS extension
- [ ] API endpoint routing
- [ ] CORS configuration

### Testing

- [ ] Run automated test suite
- [ ] Manual UI testing
- [ ] Performance testing
- [ ] Security testing

## Troubleshooting

### Common Issues

1. **DuckDB Installation**: Ensure native dependencies are installed
2. **GCS Permissions**: Verify bucket access
3. **Field Mapping**: Check field catalog consistency
4. **Memory Usage**: Monitor DuckDB memory consumption

### Debug Commands

```bash
# Check DuckDB status
curl -s "${BASE_URL}/api/studio/query" -X POST -H "Content-Type: application/json" -d '{"selectedFields":["pixel_id"],"limit":1}'

# Verify field catalog
curl -s "${BASE_URL}/api/studio/filters/fields"

# Test GCS connection
curl -s -X POST "${BASE_URL}/api/studio/load-data" -H "Content-Type: application/json" -d '{"bucketUrl":"test-url"}'
```

## Conclusion

The unified data flow implementation provides a robust, scalable solution for querying and filtering both pixel events and contact data. The system is designed to be:

- **Consistent**: Same fields for querying and filtering
- **Performant**: DuckDB-based analytics engine
- **Scalable**: Cloud-native architecture
- **Secure**: RLS and input validation
- **Maintainable**: Clear separation of concerns

This implementation successfully meets all the requirements outlined in the original milestone and provides a solid foundation for future enhancements. 