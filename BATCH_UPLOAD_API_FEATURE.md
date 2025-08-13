# Batch Upload API Feature - Milestone 4.2.1

## 🎯 Overview

The Batch Upload API replaces the webhook ingestion method with a dedicated API endpoint that accepts batch POST requests containing audience data. This provides better reliability, scalability, and ease of use for high-volume data ingestion.

## 🚀 Key Benefits

- **Reliability**: Direct API calls instead of webhook polling
- **Scalability**: Handles up to 50,000 records per request
- **Validation**: Built-in schema validation and error handling
- **Security**: Authentication required for all requests
- **Performance**: Optimized for batch processing
- **Simplicity**: Clear request/response format

## 📋 API Endpoints

### POST /api/audience/batch-upload

Uploads a batch of audience data records.

#### Request Format

```json
{
  "upload_name": "string",
  "records": [
    {
      "business_email": "string",
      "first_name": "string",
      "last_name": "string",
      "company_name": "string",
      "domain": "string",
      // ... additional fields
    }
  ],
  "fields": ["business_email", "first_name", "last_name"] // optional
}
```

#### Response Format

```json
{
  "status": "success",
  "upload_id": "upl_1234567890_abc123",
  "session_token": "sess_1234567890_def456",
  "rows_received": 10,
  "message": "Batch upload successful"
}
```

### GET /api/audience/batch-upload

Lists all batch uploads for the authenticated user.

#### Response Format

```json
{
  "status": "success",
  "uploads": [
    {
      "upload_id": "upl_1234567890_abc123",
      "upload_name": "test_batch_upload",
      "created_at": "2025-01-15T10:30:00Z",
      "rows_received": 10,
      "status": "uploaded"
    }
  ]
}
```

### GET /api/audience/batch-upload/[id]

Retrieves specific batch upload data by ID.

#### Response Format

```json
{
  "status": "success",
  "upload_id": "upl_1234567890_abc123",
  "upload_name": "test_batch_upload",
  "records": [...],
  "fields": ["business_email", "first_name", "last_name"],
  "created_at": "2025-01-15T10:30:00Z",
  "rows_received": 10,
  "status": "uploaded"
}
```

### DELETE /api/audience/batch-upload/[id]

Deletes a specific batch upload.

#### Response Format

```json
{
  "status": "success",
  "message": "Batch upload deleted successfully"
}
```

## 🔒 Security & Validation

### Authentication
- All endpoints require authentication
- Uses `enhanceRouteHandler` with `auth: true`
- User can only access their own uploads

### Validation Rules

1. **Required Fields**: At least one of `business_email`, `personal_email`, `email`, `domain`, or `company_domain`
2. **Batch Size**: Maximum 50,000 records per request (configurable via `MAX_BATCH_SIZE` env var)
3. **Payload Size**: Maximum 5MB per request
4. **Upload Name**: 1-100 characters, required
5. **Records**: Non-empty array required

### Error Responses

```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

Common HTTP status codes:
- `400`: Validation errors (missing fields, invalid data)
- `401`: Authentication required
- `403`: Access denied
- `413`: Payload too large
- `500`: Internal server error

## 🏗️ Technical Implementation

### Backend Components

1. **API Routes**:
   - `apps/web/app/api/audience/batch-upload/route.ts` - Main endpoint
   - `apps/web/app/api/audience/batch-upload/[id]/route.ts` - Individual upload management

2. **Data Storage**:
   - In-memory store for development (replace with database in production)
   - Structured data format with metadata

3. **Validation**:
   - Zod schema validation
   - Custom business logic validation
   - Size and limit enforcement

### Frontend Components

1. **BatchUploadManager**:
   - `apps/web/app/home/[account]/studio/components/BatchUploadManager.tsx`
   - Manages batch uploads in Studio interface

2. **Studio Integration**:
   - Updated `Studio.tsx` to support batch upload data source
   - Integrated with existing enrichment workflow

## 📊 Data Flow

### 1. Upload Process
```
Client → POST /api/audience/batch-upload → Validation → Storage → Response
```

### 2. Studio Integration
```
Studio → Select Batch Upload → Load Data → Display in Table → Enrichment → Save Segment
```

### 3. Data Structure
```typescript
interface BatchUpload {
  upload_id: string;
  session_token: string;
  upload_name: string;
  records: any[];
  fields: string[];
  user_id: string;
  created_at: string;
  rows_received: number;
  status: string;
}
```

## 🧪 Testing

### Test Scripts

1. **API Testing**: `test-batch-upload-api.sh`
   - Small payload test
   - Schema validation test
   - Batch size limit test
   - Payload size limit test
   - Comprehensive data test

### Manual Testing

1. **Studio Integration**:
   - Go to Studio → Upload Data → Batch Upload API
   - Create batch upload via API
   - Verify data appears in table
   - Test enrichment workflow
   - Save as segment

2. **Error Handling**:
   - Test with invalid data
   - Test with missing required fields
   - Test with oversized payloads

## 🔄 Migration from Webhooks

### Benefits of Migration

1. **Reliability**: No more polling issues
2. **Performance**: Direct API calls faster than webhook polling
3. **Validation**: Immediate feedback on data quality
4. **Scalability**: Better handling of large datasets
5. **Security**: Proper authentication and authorization

### Migration Path

1. **Phase 1**: Deploy Batch Upload API alongside webhooks
2. **Phase 2**: Update external integrations to use new API
3. **Phase 3**: Deprecate webhook functionality
4. **Phase 4**: Remove webhook code

## 🚀 Production Considerations

### Database Storage
Replace in-memory store with proper database:
```sql
CREATE TABLE batch_uploads (
  upload_id UUID PRIMARY KEY,
  session_token TEXT NOT NULL,
  upload_name TEXT NOT NULL,
  records JSONB NOT NULL,
  fields TEXT[] NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rows_received INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded'
);
```

### File Storage
For large datasets, consider storing records in cloud storage:
- Google Cloud Storage
- AWS S3
- Azure Blob Storage

### Monitoring
- Request/response logging
- Performance metrics
- Error tracking
- Usage analytics

## 📈 Future Enhancements

1. **Async Processing**: Background processing for large uploads
2. **Progress Tracking**: Real-time upload progress
3. **Data Validation**: Advanced validation rules
4. **File Upload**: Direct file upload support
5. **Bulk Operations**: Batch delete, update operations
6. **Analytics**: Upload analytics and reporting

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify Bearer token is valid
   - Check token expiration

2. **Validation Errors**:
   - Ensure required fields are present
   - Check data format and types

3. **Size Limit Errors**:
   - Reduce batch size
   - Compress data if possible

4. **Studio Integration Issues**:
   - Check browser console for errors
   - Verify data source is set correctly

### Debug Information

- Server logs include detailed error messages
- Client-side logging in browser console
- Network tab shows request/response details

## 📚 API Examples

### cURL Examples

```bash
# Basic upload
curl -X POST "http://localhost:3000/api/audience/batch-upload" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "upload_name": "test_upload",
    "records": [
      {"business_email": "test@example.com", "first_name": "Test"}
    ]
  }'

# List uploads
curl -X GET "http://localhost:3000/api/audience/batch-upload" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific upload
curl -X GET "http://localhost:3000/api/audience/batch-upload/UPLOAD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript Examples

```javascript
// Upload batch data
const response = await fetch('/api/audience/batch-upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    upload_name: 'my_upload',
    records: [
      { business_email: 'user@company.com', first_name: 'John' }
    ]
  })
});

const result = await response.json();
console.log('Upload ID:', result.upload_id);
```

## ✅ Checklist

- [x] API endpoints implemented
- [x] Authentication and authorization
- [x] Data validation
- [x] Error handling
- [x] Studio integration
- [x] Test scripts
- [x] Documentation
- [ ] Production database schema
- [ ] File storage integration
- [ ] Monitoring and logging
- [ ] Performance optimization
- [ ] Security audit 