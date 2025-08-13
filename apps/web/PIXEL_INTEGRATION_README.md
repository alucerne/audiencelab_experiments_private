# Pixel Integration for Audience Studio

This document describes the implementation of Milestone 5 — Select Audience (incl. Pixel) → Load via DuckDB → Sub-segment Filters.

## Overview

The pixel integration allows users to:
1. Select pixel audiences alongside regular audiences
2. Load pixel CSV data from Google Cloud Storage via DuckDB + httpfs
3. Apply sub-segment filters using pixel-specific fields
4. Preview filtered pixel data in the Studio interface

## Architecture

### Components Added
- **DuckDB Integration** (`lib/duck.ts`): Singleton database with httpfs extension for GCS access
- **Pixel Fields** (`lib/pixelFields.ts`): Complete field definitions for pixel datasets
- **Filter Compiler** (`lib/filtersToSQL.ts`): Converts filter rules to SQL WHERE clauses
- **API Routes**:
  - `/api/studio/audiences/list`: Lists audiences including pixel options
  - `/api/studio/audiences/select`: Loads selected audience/pixel into DuckDB
  - `/api/studio/preview`: Previews filtered data

### Data Flow
1. User selects a pixel audience from the dropdown
2. System loads pixel CSV from GCS into DuckDB table `studio_current`
3. User applies filters using pixel-specific fields
4. System compiles filters to SQL and queries DuckDB
5. Results displayed in preview table

## Configuration

### Environment Variables
Create a `.env.local` file with one of these options:

```bash
# Option 1: Signed URL (most secure)
PIXEL_SIGNED_URL=https://storage.googleapis.com/local_staging_tests/pixel_export_02661805-9760-4bea-a3b0-1535d7c5758b_20250619_020135.csv?X-Goog-Signature=...

# Option 2: Public Google APIs URL
PIXEL_API_URL=https://storage.googleapis.com/local_staging_tests/pixel_export_02661805-9760-4bea-a3b0-1535d7c5758b_20250619_020135.csv

# Option 3: Cloud Console URL (may require auth)
PIXEL_CLOUD_URL=https://storage.cloud.google.com/local_staging_tests/pixel_export_02661805-9760-4bea-a3b0-1535d7c5758b_20250619_020135.csv
```

## Pixel Fields Available

### Top-Level Fields
- `pixel_id`: Unique pixel identifier
- `hem_sha256`: Hashed email identifier
- `event_timestamp`: When the event occurred
- `event_type`: Type of pixel event
- `ip_address`: Visitor IP address
- `activity_start_date`: Session start time
- `activity_end_date`: Session end time

### Nested Event Data Fields
- `event_data.referrer`: Referring URL
- `event_data.timestamp`: Event-specific timestamp
- `event_data.title`: Page title
- `event_data.url`: Page URL
- `event_data.percentage`: Scroll percentage

### Element-Specific Fields
- `event_data.element.attributes.class`: CSS classes
- `event_data.element.attributes.href`: Element href
- `event_data.element.classes`: Element classes
- `event_data.element.id`: Element ID
- `event_data.element.tag`: HTML tag name
- `event_data.element.text`: Element text content

## Testing

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Studio
Go to `/home/[account]/studio` in your browser

### 3. Select Pixel Audience
- Choose "Pixel: 02661805-9760-4bea-a3b0-1535d7c5758b (test)" from dropdown
- Verify it loads with pixel indicator

### 4. Test Filters
- Add filters using pixel fields
- Test different operators (equals, contains, greater than, etc.)
- Preview filtered results

### 5. Verify Data Loading
Check browser console for:
- Audience selection confirmation
- Row count from loaded data
- Any error messages

## Troubleshooting

### Common Issues

1. **"No pixel URL available"**
   - Check environment variables are set correctly
   - Verify CSV file exists at specified URL
   - Ensure proper authentication if using signed URLs

2. **DuckDB connection errors**
   - Check if httpfs extension loads properly
   - Verify CSV format is valid
   - Check browser console for detailed error messages

3. **Filter compilation errors**
   - Verify field names match exactly
   - Check operator compatibility with field types
   - Review SQL generation in browser console

### Debug Mode
Enable detailed logging by checking browser console for:
- API request/response details
- DuckDB query execution
- Filter compilation steps

## Dependencies

The following packages are required:
- `duckdb`: In-memory database for CSV processing
- `dayjs`: Date/time handling (already installed)
- `zod`: Schema validation (already installed)

## Security Considerations

- **RLS Policies**: Ensure proper access control for pixel data
- **URL Validation**: Validate GCS URLs before processing
- **Data Sanitization**: Sanitize user inputs in filter creation
- **Authentication**: Use signed URLs for sensitive data access

## Performance Notes

- DuckDB loads CSV data into memory
- Large datasets may impact performance
- Consider pagination for very large pixel datasets
- httpfs extension enables efficient GCS streaming 