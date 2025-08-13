# Studio Segments Feature (Milestone 4)

## 🎯 **Overview**

The Studio Segments feature allows users to save their filtered and enriched data as reusable segments. Users can create segments from both audience data and external uploads (webhook/CSV), with automatic naming conventions and comprehensive metadata tracking.

## 👤 **User Flow**

### **Start with Any Data Source**
- **Audience Data**: Filter existing intent audience (read-only from Google Storage via DuckDB)
- **External Uploads**: Upload and enrich new external files (via webhook or CSV upload)

### **Preview & Confirm**
1. User views the filtered/enriched data table in Studio
2. They verify that the segment looks correct
3. Click "Save Segment" button (top-right of Studio interface)

### **Save Segment Modal**
- **Segment name** (default: `[Original Audience Name] – segment`)
- **Optional description** and tags
- **Preview** of applied filters, enrichment fields, and custom columns
- **Record count** and data source information

### **Dashboard Display**
- Saved segments appear in the main "Audience Lists" dashboard
- Segment names are automatically suffixed with "– segment" to distinguish from raw audiences

## 🛠 **Backend Behavior**

### **1. Segment Storage Metadata**
Only metadata is saved at this stage:
- **Source**: `audience_id` or `external_upload_id`
- **Filters used** (SQL, visual filters)
- **Enrichment flags** + fields
- **Custom columns** definitions
- **Timestamp** of creation
- **segment_id** for future lookup

### **2. Rehydration Logic**
On future load, the system:
- Fetches the daily-refreshed audience from GCS
- Re-applies filters and enrichment from the saved metadata
- Re-renders the final segment view dynamically using DuckDB
- If source was a user-upload, the file path is preserved

### **3. Naming Convention**
Segments are programmatically labeled:
```
[audience_name] – segment
e.g. Startup C-Suite 2024 – segment
```

## 📁 **Data Structure**

### **Database Schema**
```sql
create table if not exists public.segments (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  description text null,
  source_type text not null check (source_type in ('audience', 'webhook_upload', 'csv_upload')),
  source_id text not null, -- audience_id or upload_id
  filters jsonb not null default '[]'::jsonb, -- Array of filter objects
  enrichment_fields text[] not null default '[]', -- Array of enrichment field names
  custom_columns jsonb not null default '[]'::jsonb, -- Array of custom column definitions
  tags text[] not null default '[]', -- Array of tags
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
```

### **Segment Object Example**
```json
{
  "segment_id": "seg_873ghsg82",
  "audience_id": "aud_xjs92h2",
  "filters": [
    { "field": "email_valid", "operator": "=", "value": true },
    { "field": "country", "operator": "=", "value": "US" }
  ],
  "enrichment_fields": ["company_name", "first_name"],
  "custom_columns": [
    {
      "field": "custom_field",
      "headerName": "Custom Field",
      "type": "text"
    }
  ],
  "created_by": "user_4521",
  "created_at": "2025-08-07T15:22:00Z",
  "source_type": "audience"
}
```

## 🏗 **Technical Implementation**

### **File Structure**
```
apps/web/
├── app/home/[account]/studio/
│   ├── components/
│   │   ├── Studio.tsx                    # Updated with Save Segment button
│   │   └── SaveSegmentModal.tsx          # New modal component
│   └── utils/
│       ├── enrichmentOptions.ts          # Enrichment field definitions
│       └── enrichData.ts                 # Enrichment processing logic
├── lib/
│   └── segments/
│       ├── segment.service.ts            # Segment service layer
│       └── server-actions.ts             # Server actions for segments
└── supabase/
    └── migrations/
        └── 20250115000001_studio_segments.sql  # Database schema

test-segments-api.sh                      # API testing script
STUDIO_SEGMENTS_FEATURE.md                # This documentation
```

### **Key Components**

#### **1. SaveSegmentModal.tsx**
- **Purpose**: Modal for saving segments with comprehensive metadata
- **Features**:
  - Auto-generated segment names
  - Filter and enrichment field previews
  - Tag management
  - Record count display
  - Validation and error handling

#### **2. segment.service.ts**
- **Purpose**: Service layer for segment operations
- **Methods**:
  - `createSegment()`: Create new segments
  - `getSegments()`: Retrieve segments for account
  - `updateSegment()`: Update segment metadata
  - `deleteSegment()`: Soft delete segments
  - `generateSegmentName()`: Auto-generate segment names

#### **3. server-actions.ts**
- **Purpose**: Server actions for segment operations
- **Actions**:
  - `createSegmentAction`: Create segments with validation
  - `updateSegmentAction`: Update segment metadata
  - `deleteSegmentAction`: Delete segments
  - `generateSegmentNameAction`: Generate segment names

### **Database Features**

#### **Security & RLS**
- **Row Level Security**: Enabled on segments table
- **Policies**: Users can only access segments from their accounts
- **Helper Function**: `public.create_studio_segment()` for secure creation

#### **Indexes**
- `ix_segments_account_id`: Account-based queries
- `ix_segments_created_by`: User-based queries
- `ix_segments_source_type`: Source type filtering
- `ix_segments_created_at`: Time-based sorting
- `ix_segments_deleted`: Soft delete filtering

#### **Triggers**
- `set_timestamps_segments`: Automatic timestamp updates

## 🧪 **Testing**

### **Manual Testing Steps**

#### **1. Audience Data Segment**
1. Navigate to Studio: `http://localhost:3000/studio`
2. Select "Audience Data" and choose an audience
3. Apply filters and run enrichment
4. Click "Save Segment" button
5. Verify modal opens with correct metadata
6. Save segment and verify success message

#### **2. Webhook Data Segment**
1. Switch to "Upload Data" → "Webhook"
2. Send test data via webhook
3. Apply filters and enrichment
4. Click "Save Segment" button
5. Verify segment is saved with webhook source type

#### **3. CSV Upload Segment**
1. Switch to "Upload Data" → "Upload CSV"
2. Upload a CSV file and map fields
3. Apply filters and enrichment
4. Click "Save Segment" button
5. Verify segment is saved with CSV source type

### **API Testing**
```bash
# Run the test script
./test-segments-api.sh
```

### **Database Verification**
```sql
-- Check segments table
SELECT * FROM public.segments WHERE deleted = false;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'segments';

-- Test helper function
SELECT public.create_studio_segment(
  'account-uuid',
  'Test Segment',
  'Test description',
  'audience',
  'audience-id',
  '[]'::jsonb,
  ARRAY['company_name'],
  '[]'::jsonb,
  ARRAY['test']
);
```

## 🔧 **Configuration**

### **Environment Variables**
No additional environment variables required for basic functionality.

### **Database Migration**
```bash
# Apply the migration
pnpm run supabase:web:reset
```

### **Naming Conventions**
- **Audience Segments**: `[Audience Name] – segment`
- **Webhook Segments**: `Webhook Data – segment (Date)`
- **CSV Segments**: `CSV Upload – segment (Date)`

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Database migration applied
- [ ] RLS policies verified
- [ ] Helper functions created
- [ ] Indexes created

### **Post-Deployment**
- [ ] Test segment creation from audience data
- [ ] Test segment creation from webhook data
- [ ] Test segment creation from CSV upload
- [ ] Verify naming conventions
- [ ] Check database performance

### **Monitoring**
- [ ] Monitor segment creation rates
- [ ] Track segment usage patterns
- [ ] Monitor database performance
- [ ] Check for naming conflicts

## 🔒 **Security Considerations**

### **Data Access**
- Segments are scoped to user accounts
- RLS policies prevent cross-account access
- Soft deletes preserve data integrity

### **Validation**
- Input validation on all segment operations
- Schema validation for filters and custom columns
- SQL injection prevention through parameterized queries

### **Audit Trail**
- All segment operations are logged
- User tracking for creation and updates
- Timestamp tracking for all operations

## 📈 **Future Enhancements**

### **Planned Features**
1. **Segment Templates**: Pre-defined segment configurations
2. **Bulk Operations**: Create multiple segments at once
3. **Segment Analytics**: Usage and performance metrics
4. **Advanced Filtering**: More complex filter combinations
5. **Segment Sharing**: Share segments between team members

### **Performance Optimizations**
1. **Caching**: Cache frequently accessed segments
2. **Pagination**: Handle large segment lists
3. **Search**: Full-text search across segments
4. **Export**: Export segments to various formats

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Segment Creation Fails**
- **Cause**: Missing account ID or invalid source
- **Solution**: Verify user authentication and source data

#### **2. Naming Conflicts**
- **Cause**: Duplicate segment names
- **Solution**: Auto-append timestamp or increment

#### **3. Filter Validation Errors**
- **Cause**: Invalid filter syntax
- **Solution**: Validate filters before saving

#### **4. Database Connection Issues**
- **Cause**: Supabase connection problems
- **Solution**: Check database status and credentials

### **Debug Information**
- Check browser console for client-side errors
- Check server logs for server-side errors
- Verify database connectivity and permissions
- Test with minimal data to isolate issues

## 📚 **API Reference**

### **Server Actions**

#### **createSegmentAction**
```typescript
const result = await createSegmentAction({
  name: "Segment Name",
  description: "Optional description",
  sourceType: "audience" | "webhook_upload" | "csv_upload",
  sourceId: "source-id",
  filters: [],
  enrichmentFields: [],
  customColumns: [],
  tags: []
});
```

#### **generateSegmentNameAction**
```typescript
const result = await generateSegmentNameAction({
  sourceType: "audience",
  sourceId: "audience-id",
  baseName: "Optional base name"
});
```

### **Service Methods**

#### **SegmentService**
```typescript
const segmentService = createSegmentService(client);

// Create segment
const segment = await segmentService.createSegment(params);

// Get segments
const segments = await segmentService.getSegments({ accountId });

// Update segment
const updated = await segmentService.updateSegment({
  segmentId,
  name: "New Name"
});

// Delete segment
await segmentService.deleteSegment({ segmentId });
```

## ✅ **Success Criteria**

- [ ] Users can save segments from audience data
- [ ] Users can save segments from webhook data
- [ ] Users can save segments from CSV uploads
- [ ] Automatic naming conventions work correctly
- [ ] Segment metadata is properly stored
- [ ] RLS policies prevent unauthorized access
- [ ] UI provides clear feedback and validation
- [ ] Performance is acceptable for typical usage
- [ ] Error handling is comprehensive
- [ ] Documentation is complete and accurate

## 📝 **Notes**

- Segments are metadata-only; actual data is rehydrated on demand
- Naming conventions help distinguish segments from raw audiences
- Soft deletes preserve data integrity and audit trails
- RLS ensures proper data isolation between accounts
- The feature integrates seamlessly with existing Studio functionality 