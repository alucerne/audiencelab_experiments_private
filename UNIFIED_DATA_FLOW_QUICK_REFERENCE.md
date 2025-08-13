# Unified Data Flow - Quick Reference

## 🚀 Quick Start

### 1. Load Data from GCS
```bash
curl -X POST "http://localhost:3000/api/studio/load-data" \
  -H "Content-Type: application/json" \
  -d '{"bucketUrl": "https://storage.cloud.google.com/your-bucket/data.csv"}'
```

### 2. Query Data
```bash
curl -X POST "http://localhost:3000/api/studio/query" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedFields": ["event_type", "url", "percentage"],
    "filters": [
      {"field": "event_type", "operator": "=", "value": "page_view"},
      {"field": "percentage", "operator": ">", "value": "40"}
    ],
    "limit": 100,
    "offset": 0
  }'
```

### 3. Save Segment
```bash
curl -X POST "http://localhost:3000/api/studio/segments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Engagement Users",
    "selectedFields": ["event_type", "url", "percentage"],
    "filters": [
      {"field": "percentage", "operator": ">", "value": "50"}
    ],
    "account_id": "your-account-id"
  }'
```

## 📋 Field Catalog

### Pixel Event Fields
```typescript
// Direct columns
pixel_id, hem_sha256, event_timestamp, event_type, ip_address

// JSON extracted from event_data
percentage, timestamp, url
```

### Contact Data Fields
```typescript
// Basic info
UUID, FIRST_NAME, LAST_NAME, PERSONAL_ADDRESS

// Demographics
AGE_RANGE, GENDER, HOMEOWNER, MARRIED, CHILDREN

// Contact info
BUSINESS_EMAIL, PERSONAL_EMAILS, MOBILE_PHONE, DIRECT_NUMBER

// Professional
JOB_TITLE, COMPANY_NAME, COMPANY_INDUSTRY, INFERRED_YEARS_EXPERIENCE
```

## 🔧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/studio/filters/fields` | GET | Get unified field catalog |
| `/api/studio/load-data` | POST | Load CSV from GCS |
| `/api/studio/query` | POST | Query data with filters |
| `/api/studio/segments` | POST/GET | Manage segments |

## 🎯 Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `event_type = 'page_view'` |
| `!=` | Not equals | `event_type != 'click'` |
| `>` | Greater than | `percentage > 40` |
| `<` | Less than | `percentage < 80` |
| `>=` | Greater than or equal | `percentage >= 50` |
| `<=` | Less than or equal | `percentage <= 90` |
| `contains` | Contains substring | `url contains 'services'` |
| `starts_with` | Starts with | `url starts_with 'https://'` |
| `ends_with` | Ends with | `url ends_with '.com'` |
| `exists` | Field exists | `percentage exists` |

## 🧩 UI Components

### FieldSelector
```tsx
import FieldSelector from './components/FieldSelector';

<FieldSelector
  selectedFields={selectedFields}
  onFieldsChange={setSelectedFields}
  isPixelAudience={isPixelAudience}
/>
```

### Filters
```tsx
import Filters from './components/Filters';

<Filters
  onChange={setFilters}
  isPixelAudience={isPixelAudience}
/>
```

## 📊 Query Examples

### Basic Query
```typescript
const query = {
  selectedFields: ["event_type", "url"],
  filters: [],
  limit: 100,
  offset: 0
};
```

### Filtered Query
```typescript
const query = {
  selectedFields: ["event_type", "url", "percentage"],
  filters: [
    { field: "event_type", operator: "=", value: "page_view" },
    { field: "percentage", operator: ">", value: "40" }
  ],
  limit: 50,
  offset: 0
};
```

### Complex Filter
```typescript
const query = {
  selectedFields: ["FIRST_NAME", "LAST_NAME", "COMPANY_NAME", "JOB_TITLE"],
  filters: [
    { field: "COMPANY_INDUSTRY", operator: "=", value: "Technology" },
    { field: "INFERRED_YEARS_EXPERIENCE", operator: ">=", value: "5" },
    { field: "HOMEOWNER", operator: "=", value: "true" }
  ],
  limit: 100,
  offset: 0
};
```

## 🔍 Testing

### Run Full Test Suite
```bash
./test-unified-data-flow.sh
```

### Individual Tests
```bash
# Test field catalog
curl -s "http://localhost:3000/api/studio/filters/fields"

# Test query
curl -s -X POST "http://localhost:3000/api/studio/query" \
  -H "Content-Type: application/json" \
  -d '{"selectedFields":["pixel_id"],"limit":1}'

# Test segment creation
curl -s -X POST "http://localhost:3000/api/studio/segments" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","selectedFields":[],"filters":[],"account_id":"test"}'
```

## 🛠️ Development

### Adding New Fields
1. Update `fieldCatalog.ts`
2. Add field definition with proper expression
3. Test with query API
4. Update UI components if needed

### Debugging
```typescript
// Check DuckDB status
const result = await duckDBService.getTableInfo();
console.log('Table info:', result);

// Check row count
const count = await duckDBService.getRowCount();
console.log('Row count:', count);
```

### Common Issues

**Field Not Found**
- Check field key in catalog
- Verify field expression syntax
- Test with simple query first

**GCS Loading Failed**
- Verify bucket permissions
- Check URL format
- Test with local CSV first

**Query Timeout**
- Reduce limit/offset
- Simplify filters
- Check DuckDB memory usage

## 📈 Performance Tips

### Query Optimization
- Use specific field selection instead of `*`
- Apply filters early in the query
- Use appropriate data types
- Limit result sets

### Memory Management
- Paginate large results
- Close DuckDB connections properly
- Monitor memory usage
- Use streaming for large exports

## 🔐 Security

### Input Validation
- All field keys validated against catalog
- SQL injection prevention
- Type checking for all operations
- RLS policies enforced

### Access Control
- Account-based data isolation
- Role-based permissions
- Audit logging
- Secure API endpoints

## 📚 Resources

- [DuckDB Documentation](https://duckdb.org/docs/)
- [Google Cloud Storage API](https://cloud.google.com/storage/docs)
- [Field Catalog Reference](./fieldCatalog.ts)
- [API Documentation](./UNIFIED_DATA_FLOW_IMPLEMENTATION.md) 