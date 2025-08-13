# Studio Segments Deployment Checklist

## 🎯 **Deployment Overview**

This checklist covers the deployment of Milestone 4: Studio Segments feature. The feature allows users to save filtered and enriched data as reusable segments with comprehensive metadata tracking.

## 📋 **Pre-Deployment Checklist**

### **Database Setup**
- [ ] **Migration Applied**: `20250115000001_studio_segments.sql` has been applied
- [ ] **Table Created**: `public.segments` table exists
- [ ] **RLS Enabled**: Row Level Security is enabled on segments table
- [ ] **Policies Created**: All RLS policies are in place
- [ ] **Indexes Created**: Performance indexes are created
- [ ] **Triggers Created**: Timestamp triggers are working
- [ ] **Helper Function**: `public.create_studio_segment()` function exists

### **Code Deployment**
- [ ] **Segment Service**: `lib/segments/segment.service.ts` deployed
- [ ] **Server Actions**: `lib/segments/server-actions.ts` deployed
- [ ] **SaveSegmentModal**: `components/SaveSegmentModal.tsx` deployed
- [ ] **Studio Component**: Updated `components/Studio.tsx` deployed
- [ ] **Type Definitions**: All TypeScript types are properly defined

### **Environment Verification**
- [ ] **Supabase Connection**: Database connection is working
- [ ] **Authentication**: User authentication is functional
- [ ] **Permissions**: User permissions are properly configured
- [ ] **Environment Variables**: All required env vars are set

## 🚀 **Deployment Steps**

### **Step 1: Database Migration**
```bash
# Apply the migration
pnpm run supabase:web:reset

# Verify migration
psql -h your-supabase-host -U postgres -d postgres -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'segments';
"
```

### **Step 2: Verify Database Schema**
```sql
-- Check table structure
\d public.segments

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'segments';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'segments';

-- Check helper function
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_studio_segment';
```

### **Step 3: Deploy Application Code**
```bash
# Build and deploy the application
pnpm run build
pnpm run start

# Or for production
pnpm run deploy
```

### **Step 4: Verify File Structure**
```bash
# Check that all files are in place
ls -la apps/web/lib/segments/
ls -la apps/web/app/home/[account]/studio/components/SaveSegmentModal.tsx
ls -la supabase/migrations/20250115000001_studio_segments.sql
```

## 🧪 **Post-Deployment Testing**

### **Functional Testing**

#### **1. Audience Data Segments**
- [ ] Navigate to Studio: `http://localhost:3000/studio`
- [ ] Select "Audience Data" and choose an audience
- [ ] Apply filters (e.g., country = US)
- [ ] Run enrichment (e.g., company_name, first_name)
- [ ] Click "Save Segment" button
- [ ] Verify modal opens with correct metadata
- [ ] Verify auto-generated name follows convention
- [ ] Save segment and verify success message
- [ ] Check database for segment record

#### **2. Webhook Data Segments**
- [ ] Switch to "Upload Data" → "Webhook"
- [ ] Send test data via webhook endpoint
- [ ] Apply filters and enrichment
- [ ] Click "Save Segment" button
- [ ] Verify segment is saved with webhook source type
- [ ] Check database for correct metadata

#### **3. CSV Upload Segments**
- [ ] Switch to "Upload Data" → "Upload CSV"
- [ ] Upload a CSV file and map fields
- [ ] Apply filters and enrichment
- [ ] Click "Save Segment" button
- [ ] Verify segment is saved with CSV source type
- [ ] Check database for correct metadata

### **API Testing**
```bash
# Run the test script
chmod +x test-segments-api.sh
./test-segments-api.sh
```

### **Database Verification**
```sql
-- Check segments table
SELECT 
  id,
  name,
  source_type,
  source_id,
  enrichment_fields,
  tags,
  created_at
FROM public.segments 
WHERE deleted = false
ORDER BY created_at DESC;

-- Check RLS is working
-- This should only return segments for the current user's account
SELECT COUNT(*) FROM public.segments;
```

### **Performance Testing**
- [ ] **Segment Creation**: Test creating segments with large datasets
- [ ] **Modal Performance**: Verify modal opens quickly
- [ ] **Database Queries**: Check query performance
- [ ] **Memory Usage**: Monitor memory usage during segment operations

### **Security Testing**
- [ ] **RLS Policies**: Verify users can only access their own segments
- [ ] **Input Validation**: Test with invalid input data
- [ ] **Authentication**: Verify unauthenticated users cannot access segments
- [ ] **Authorization**: Test cross-account access prevention

## 🔍 **Monitoring & Validation**

### **Database Monitoring**
```sql
-- Monitor segment creation
SELECT 
  DATE(created_at) as date,
  source_type,
  COUNT(*) as segments_created
FROM public.segments 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), source_type
ORDER BY date DESC;

-- Check for any errors
SELECT 
  created_at,
  name,
  source_type,
  source_id
FROM public.segments 
WHERE source_id IS NULL OR source_id = '';
```

### **Application Monitoring**
- [ ] **Error Logs**: Check for any segment-related errors
- [ ] **Performance Metrics**: Monitor segment creation times
- [ ] **User Feedback**: Collect feedback on segment functionality
- [ ] **Usage Analytics**: Track segment creation patterns

### **Health Checks**
```bash
# Test segment creation via API
curl -X POST http://localhost:3000/api/segments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Health Check Segment",
    "sourceType": "audience",
    "sourceId": "test-id",
    "filters": [],
    "enrichmentFields": [],
    "customColumns": [],
    "tags": []
  }'
```

## 🚨 **Rollback Plan**

### **If Issues Occur**
1. **Database Rollback**:
   ```sql
   -- Soft delete all segments (if needed)
   UPDATE public.segments SET deleted = true;
   
   -- Or drop the table (if completely removing)
   DROP TABLE IF EXISTS public.segments CASCADE;
   ```

2. **Code Rollback**:
   ```bash
   # Revert to previous version
   git checkout HEAD~1
   pnpm run build
   pnpm run deploy
   ```

3. **Feature Flag**:
   ```typescript
   // Add feature flag to disable segments
   const SEGMENTS_ENABLED = process.env.SEGMENTS_ENABLED === 'true';
   ```

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] Users can save segments from all data sources (audience, webhook, CSV)
- [ ] Automatic naming conventions work correctly
- [ ] Segment metadata is properly stored and retrieved
- [ ] RLS policies prevent unauthorized access
- [ ] UI provides clear feedback and validation

### **Performance Requirements**
- [ ] Segment creation completes within 5 seconds
- [ ] Modal opens within 1 second
- [ ] Database queries are optimized
- [ ] No memory leaks during segment operations

### **Security Requirements**
- [ ] All segment operations are properly authenticated
- [ ] RLS policies prevent cross-account access
- [ ] Input validation prevents malicious data
- [ ] Audit trail is maintained for all operations

### **User Experience Requirements**
- [ ] Save Segment button appears when data is available
- [ ] Modal provides comprehensive metadata preview
- [ ] Success/error messages are clear and helpful
- [ ] Naming conventions are intuitive

## 📊 **Post-Deployment Metrics**

### **Track These Metrics**
- **Segment Creation Rate**: Number of segments created per day
- **Source Type Distribution**: Breakdown by audience/webhook/CSV
- **Enrichment Usage**: Most common enrichment fields
- **Error Rate**: Percentage of failed segment creations
- **User Adoption**: Percentage of users creating segments

### **Success Indicators**
- [ ] >90% of segment creations succeed
- [ ] <2 second average creation time
- [ ] >50% of users create at least one segment
- [ ] No security incidents reported
- [ ] Positive user feedback

## 📝 **Documentation**

### **Update These Documents**
- [ ] **API Documentation**: Update with segment endpoints
- [ ] **User Guide**: Add segment creation instructions
- [ ] **Developer Guide**: Document segment architecture
- [ ] **Troubleshooting Guide**: Add segment-specific issues

### **Create These Documents**
- [ ] **Segment Management Guide**: How to manage saved segments
- [ ] **Segment Best Practices**: Guidelines for effective segment creation
- [ ] **Segment Analytics Guide**: How to analyze segment performance

## 🔄 **Maintenance**

### **Regular Tasks**
- [ ] **Database Cleanup**: Remove old soft-deleted segments
- [ ] **Performance Monitoring**: Check query performance
- [ ] **Security Audits**: Review RLS policies
- [ ] **User Feedback**: Collect and address user feedback

### **Future Enhancements**
- [ ] **Segment Templates**: Pre-defined configurations
- [ ] **Bulk Operations**: Create multiple segments
- [ ] **Advanced Analytics**: Segment performance metrics
- [ ] **Export Features**: Export segments to various formats

## 📞 **Support Contacts**

### **Technical Support**
- **Database Issues**: Database team
- **UI/UX Issues**: Frontend team
- **API Issues**: Backend team
- **Security Issues**: Security team

### **Escalation Path**
1. Check application logs
2. Verify database connectivity
3. Test with minimal data
4. Contact relevant team lead
5. Escalate to project manager if needed

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________
**Status**: ⏳ Pending / ✅ Complete / ❌ Failed 