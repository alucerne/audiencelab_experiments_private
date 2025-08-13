# Audience Studio Unified API

This document describes the unified API endpoints for the Audience Studio, which provide consistent data loading, field catalog management, and filtering capabilities.

## Overview

The unified Studio API replaces multiple legacy endpoints with a single, consistent approach that:
- Uses a unified field catalog for all field definitions
- Provides structured logging and error handling
- Supports multiple data formats (CSV, Parquet, JSON)
- Handles JSON extractions dynamically through the field catalog
- Ensures no hardcoded field mappings or JSON extractions

## API Endpoints

### 1. Field Catalog Endpoint

**GET** `/api/studio/filters/fields`

Returns the unified field catalog with all available fields for filtering and querying.

**Response:**
```json
{
  "status": "ok",
  "totalFields": 5,
  "fields": [
    {
      "key": "event_type",
      "label": "Event Type",
      "type": "string",
      "group": "pixel_event",
      "expr": "event_type"
    },
    {
      "key": "event_timestamp",
      "label": "Event Timestamp", 
      "type": "timestamp",
      "group": "pixel_event",
      "expr": "CAST(event_timestamp AS TIMESTAMP)"
    },
    {
      "key": "activity_end_date",
      "label": "Activity End Date",
      "type": "timestamp", 
      "group": "pixel_event",
      "expr": "CAST(activity_end_date AS TIMESTAMP)"
    },
    {
      "key": "percentage",
      "label": "Percentage",
      "type": "number",
      "group": "pixel_event", 
      "expr": "percentage"
    },
    {
      "key": "pixel_id",
      "label": "Pixel ID",
      "type": "string",
      "group": "pixel_event",
      "expr": "pixel_id"
    }
  ]
}
```

### 2. Data Loading Endpoint

**POST** `/api/studio/audiences/select`

Loads data from a URL (GCS, HTTP, etc.) into DuckDB and creates the `filters_attributes` view.

**Request Body:**
```json
{
  "url": "https://storage.googleapis.com/your-bucket/your-file.csv",
  "format": "csv"
}
```

**Response:**
```json
{
  "status": "ok",
  "loaded": {
    "url": "https://storage.googleapis.com/your-bucket/your-file.csv",
    "format": "csv"
  },
  "loaded_rows": 200,
  "view_rows": 200,
  "catalog": "v1",
  "duration_ms": 3066,
  "url_hash": "393b948f",
  "message": "Successfully loaded 200 rows and created unified view with 200 rows"
}
```

**Supported Formats:**
- `csv` - Comma-separated values
- `parquet` - Apache Parquet files
- `json` - JSON files

### 3. Preview Endpoint

**POST** `/api/studio/filters/preview`

Executes filtered queries against the loaded data with pagination support.

**Request Body:**
```json
{
  "filterTree": {
    "combinator": "and",
    "rules": [
      {
        "field": "event_type",
        "op": "=",
        "value": "page_view"
      },
      {
        "field": "percentage", 
        "op": ">",
        "value": 40
      }
    ]
  },
  "limit": 5,
  "offset": 0
}
```

**Response:**
```json
{
  "status": "ok",
  "rows": [...],
  "limit": 5,
  "offset": 0,
  "total_rows": 45,
  "has_filters": true
}
```

**Supported Operators:**
- `=` - Equals
- `!=` - Not equals  
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `contains` - Contains substring
- `startsWith` - Starts with substring
- `endsWith` - Ends with substring
- `isNull` - Is null
- `notNull` - Is not null

## Data Flow

### 1. Data Loading Flow

```
User selects file → /api/studio/audiences/select → 
Load data into studio_current → Create filters_attributes view → 
Return success with row counts
```

### 2. Filtering Flow

```
User builds filters → /api/studio/filters/preview → 
Validate against field catalog → Compile to SQL → 
Execute query → Return filtered results
```

### 3. Field Catalog Flow

```
UI requests fields → /api/studio/filters/fields → 
Return unified field catalog → UI populates filter builders
```

## Field Catalog Structure

The unified field catalog is defined in `~/lib/unifiedFieldCatalog.ts` and provides:

### Field Definition
```typescript
interface FieldDefinition {
  key: string;           // Unique field identifier
  label: string;         // Human-readable label
  type: string;          // Data type (string, number, timestamp, etc.)
  group: string;         // Field group (pixel_event, contact)
  expr: string;          // DuckDB expression for the field
}
```

### Field Groups
- `pixel_event` - Pixel tracking event data
- `contact` - Contact/audience data

### Field Types
- `string` - Text data
- `number` - Numeric data  
- `timestamp` - Date/time data
- `boolean` - True/false data
- `json` - JSON object data

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Not found (data not loaded)
- `410` - Gone (deprecated endpoint)
- `500` - Internal server error

## Logging

All endpoints use structured logging with:
- Request context (user, audience, URL hash)
- Performance metrics (duration, row counts)
- Error details with stack traces
- Field catalog version tracking

## Migration from Legacy Endpoints

### Deprecated Endpoints
- `/api/studio/load-data` → Use `/api/studio/audiences/select`
- `/api/studio/query` → Use `/api/studio/filters/preview`  
- `/api/studio/preview` → Use `/api/studio/filters/preview`

### Deprecated Files
- `~/lib/pixelFields.ts` → Use `~/lib/unifiedFieldCatalog.ts`
- `~/lib/pixelSql.ts` → Use `~/lib/unifiedFieldCatalog.ts`
- `~/lib/filterAttributesCatalog.ts` → Use `~/lib/unifiedFieldCatalog.ts`

### Migration Guide

**Old data loading:**
```javascript
// OLD
fetch('/api/studio/load-data', {
  method: 'POST',
  body: JSON.stringify({ bucketUrl: 'gs://bucket/file.csv' })
});

// NEW  
fetch('/api/studio/audiences/select', {
  method: 'POST',
  body: JSON.stringify({ 
    url: 'https://storage.googleapis.com/bucket/file.csv',
    format: 'csv'
  })
});
```

**Old filtering:**
```javascript
// OLD
fetch('/api/studio/query', {
  method: 'POST', 
  body: JSON.stringify({
    selectedFields: ['event_type', 'percentage'],
    filters: [{ field: 'event_type', operator: '=', value: 'page_view' }]
  })
});

// NEW
fetch('/api/studio/filters/preview', {
  method: 'POST',
  body: JSON.stringify({
    filterTree: {
      combinator: 'and',
      rules: [{ field: 'event_type', op: '=', value: 'page_view' }]
    },
    limit: 10
  })
});
```

## Testing

### Test Data Loading
```bash
curl -s -X POST http://localhost:3000/api/studio/audiences/select \
  -H "Content-Type: application/json" \
  -d '{"url":"https://storage.googleapis.com/staging_tests_main/Pixel_Local_Test%20-%20random_contacts.csv","format":"csv"}' | jq
```

### Test Field Catalog
```bash
curl -s http://localhost:3000/api/studio/filters/fields | jq
```

### Test Preview
```bash
curl -s -X POST http://localhost:3000/api/studio/filters/preview \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}' | jq
```

### Test Filtered Preview
```bash
curl -s -X POST http://localhost:3000/api/studio/filters/preview \
  -H "Content-Type: application/json" \
  -d '{
    "filterTree": {
      "combinator": "and", 
      "rules": [
        {"field": "event_type", "op": "=", "value": "page_view"},
        {"field": "percentage", "op": ">", "value": 40}
      ]
    },
    "limit": 5
  }' | jq
```

## Architecture Benefits

1. **Unified Field Catalog** - Single source of truth for all field definitions
2. **No Hardcoded JSON Extractions** - All JSON handling is dynamic through the field catalog
3. **Consistent Error Handling** - Standardized error responses across all endpoints
4. **Structured Logging** - Comprehensive logging for debugging and monitoring
5. **Type Safety** - Full TypeScript support with proper interfaces
6. **Extensible** - Easy to add new fields, operators, and data formats
7. **Performance** - Optimized queries with proper indexing and caching 