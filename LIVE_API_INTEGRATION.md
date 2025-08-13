# Live API Integration for Studio

This document describes the integration of live pixel and audience APIs with the Studio application, enabling real-time data analysis and filtering.

## Overview

The Studio application now supports:
- ✅ **Live Pixel API Integration**: Fetch real-time pixel event data from production APIs
- ✅ **Live Audience API Integration**: Fetch audience data (mock data for now)
- ✅ **Advanced Filtering**: Including the new "exists" operator for sub-segment filters
- ✅ **Data Table Display**: View filtered results with field management capabilities
- ✅ **Field Management**: Add and remove fields from the data table

## API Endpoints

### 1. Pixel API Integration

#### Live Pixel Data Fetch
- **Endpoint**: `GET /api/studio/pixel/fetch-live`
- **Purpose**: Fetch pixel events from live API and import into DuckDB
- **Live API**: `https://v3-api-job-72802495918.us-east1.run.app/pixel/fetch`
- **API Key**: `sk_2ly5wEhHTmNyMZCc910W7OaMpuuuAhRqMXOtQM`

#### Studio Audience Selection
- **Endpoint**: `POST /api/studio/audiences/select`
- **Purpose**: Select a pixel audience and load live data into `studio_current` table
- **Parameters**: `{ id: string, type: 'pixel' }`
- **Response**: Live pixel data loaded into DuckDB

#### Studio Preview with Filters
- **Endpoint**: `POST /api/studio/filters/preview`
- **Purpose**: Apply filters to live pixel data and return results for data table
- **Parameters**: `{ filterTree: FilterTree, limit?: number }`
- **Response**: Filtered pixel events for display

### 2. Audience API Integration

#### Live Audience Data Fetch
- **Endpoint**: `GET /api/studio/audience/fetch-live`
- **Purpose**: Fetch audience data from live API (currently mock data)
- **Status**: Ready for real API integration

## Studio User Flow

### Complete User Journey

1. **Select Pixel ID**
   - User selects a pixel audience from the Studio interface
   - System calls `/api/studio/audiences/select` with pixel ID
   - Live API fetches 1000 records and stores in `studio_current` table

2. **Add Filters**
   - User adds sub-segment filters using the Filters component
   - Supports all operators including the new "exists" operator
   - Filters are applied to live pixel data

3. **Preview Sub-segment**
   - User clicks "Preview Sub-segment" button
   - System calls `/api/studio/filters/preview` with filter tree
   - Returns filtered results for data table display

4. **View Data Table**
   - Results display in the Studio data table
   - Shows live pixel event data with all available fields
   - Supports pagination and field management

5. **Manage Fields**
   - Users can add and remove fields from the data table
   - Available fields: pixel_id, hem_sha256, event_timestamp, event_type, ip_address, activity_start_date, activity_end_date, referrer_url, resolution, event_data

## Available Data Fields

The live pixel data includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `pixel_id` | string | Unique identifier for the pixel |
| `hem_sha256` | string | Hashed email address |
| `event_timestamp` | timestamp | When the event occurred |
| `event_type` | string | Type of event (e.g., "page_view") |
| `ip_address` | string | IP address of the user |
| `activity_start_date` | timestamp | Start of activity session |
| `activity_end_date` | timestamp | End of activity session |
| `referrer_url` | string | URL that referred the user |
| `resolution` | json | Resolution data from enrichment |
| `event_data` | json | Additional event metadata |

## Filter Operators

The Studio supports the following filter operators:

- `=` - Equals
- `!=` - Does not equal
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `contains` - Contains substring
- `starts_with` - Starts with substring
- `ends_with` - Ends with substring
- `exists` - **NEW** - Field exists (no value required)

## Database Schema

### Studio Current Table
The live pixel data is stored in the `studio_current` table with the following schema:

```sql
CREATE TABLE studio_current (
  pixel_id VARCHAR,
  hem_sha256 VARCHAR,
  event_timestamp TIMESTAMP,
  event_type VARCHAR,
  ip_address VARCHAR,
  activity_start_date TIMESTAMP,
  activity_end_date TIMESTAMP,
  event_data JSON,
  referrer_url VARCHAR,
  resolution JSON
);
```

## Testing

### Complete Flow Test
Run the comprehensive test script to verify the entire Studio flow:

```bash
./test-studio-complete-flow.sh
```

This test verifies:
- ✅ Audience selection with live API
- ✅ Filter application (including "exists" operator)
- ✅ Data table population
- ✅ Field management functionality

### Individual Endpoint Tests

#### Test Pixel API
```bash
./test-pixel-api.sh
```

#### Test Audience API
```bash
./test-audience-api.sh
```

## Configuration

### Environment Variables
The following environment variables should be set for production:

```env
# Live API Configuration
LIVE_PIXEL_API_URL=https://v3-api-job-72802495918.us-east1.run.app
LIVE_PIXEL_API_KEY=sk_2ly5wEhHTmNyMZCc910W7OaMpuuuAhRqMXOtQM

# Audience API (when available)
LIVE_AUDIENCE_API_URL=your_audience_api_url
LIVE_AUDIENCE_API_KEY=your_audience_api_key
```

## Security Considerations

- API keys are currently hardcoded for development
- Move to environment variables for production
- Consider implementing API key rotation
- Validate all user inputs before applying filters

## Performance Notes

- Live API fetches 1000 records per page
- DuckDB provides fast local querying
- Filtering happens on local data for performance
- Consider implementing caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **"Failed to load audience" error**
   - Ensure the development server is running
   - Check that the live API is accessible
   - Verify the pixel ID exists in the live system

2. **No data in preview**
   - Check that an audience has been selected
   - Verify the `studio_current` table has data
   - Ensure filters are correctly formatted

3. **Filter not working**
   - Check the filter syntax in the browser console
   - Verify the field name exists in the data
   - Test with the "exists" operator for field presence

### Debug Information
The Studio component includes debug information in development mode showing:
- Data source type
- Record counts
- Available fields
- Filter status

## Future Enhancements

- [ ] Implement real audience API integration
- [ ] Add support for multiple data sources
- [ ] Implement advanced analytics features
- [ ] Add export functionality for filtered data
- [ ] Implement real-time data updates 