# Studio Enrichment Feature - Deployment Checklist

## 🎯 **Database Deployment Status**

### ✅ **Good News: No Database Changes Required!**

The Studio enrichment feature is designed to work with **existing infrastructure** and requires **no new database tables or modifications**.

## 📋 **Pre-Deployment Verification**

### **1. Verify Existing Tables Exist**
Run these queries in your staging/production Supabase SQL editor:

```sql
-- Check if required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('accounts', 'job_enrich', 'audience');

-- Expected result:
-- table_name
-- -----------
-- accounts
-- job_enrich  
-- audience
```

### **2. Verify RLS Policies Exist**
```sql
-- Check if RLS policies exist for required tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('accounts', 'job_enrich', 'audience');

-- Expected: Multiple policies for each table (SELECT, INSERT, UPDATE, DELETE)
```

### **3. Verify Required Functions Exist**
```sql
-- Check if required functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('has_role_on_account', 'is_account_owner');

-- Expected result:
-- routine_name
-- -------------
-- has_role_on_account
-- is_account_owner
```

### **4. Verify Authentication Works**
```sql
-- Test authentication (run as authenticated user)
SELECT auth.uid() as current_user_id;

-- Test account access
SELECT public.has_role_on_account('your-account-id');
```

## 🚀 **Deployment Steps**

### **Step 1: Code Deployment**
1. ✅ Deploy the updated Studio component (`Studio.tsx`)
2. ✅ Deploy the enrichment utilities (`enrichmentOptions.ts`, `enrichData.ts`)
3. ✅ Deploy the enrichment API endpoint (`/api/enrich/route.ts`)

### **Step 2: Environment Variables**
Ensure these environment variables are set in staging/production:
```bash
# Required for enrichment API
NEXT_PUBLIC_SITE_URL=https://your-staging-domain.com

# Optional: For real enrichment service (currently using mock data)
ENRICHMENT_API_URL=https://your-enrichment-service.com
ENRICHMENT_API_KEY=your-api-key
```

### **Step 3: Database Verification**
Run the verification queries above to confirm all required infrastructure exists.

### **Step 4: Testing**
1. ✅ Test the enrichment API endpoint
2. ✅ Test the Studio enrichment UI
3. ✅ Test with both audience and webhook data sources
4. ✅ Test authentication and authorization

## 🔧 **Optional: Usage Tracking (Future Enhancement)**

If you want to track enrichment usage for analytics or billing:

### **Step 1: Enable Usage Tracking**
1. Uncomment the table creation in `supabase/migrations/20250115000000_studio_enrichment_tracking.sql`
2. Run the migration in your staging/production environment

### **Step 2: Update API to Log Usage**
Modify `/api/enrich/route.ts` to log usage:

```typescript
// Add to the enrichment API
const logger = await getLogger();
const client = getSupabaseServerClient();

// Log usage (optional)
await client.from('studio_enrichment_log').insert({
  account_id: user.id,
  user_id: user.id,
  session_id: 'studio-session',
  data_source: 'audience', // or 'webhook'
  rows_processed: 1,
  fields_enriched: body.enrich,
  success_count: 1,
  error_count: 0,
  processing_time_ms: Date.now() - startTime
});
```

## 🧪 **Testing Checklist**

### **API Testing**
```bash
# Test enrichment API
curl -X POST https://your-staging-domain.com/api/enrich \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "email": "test@example.com",
    "enrich": ["first_name", "company_name"]
  }'
```

### **UI Testing**
- [ ] Load Studio with audience data
- [ ] Verify enrichment panel appears
- [ ] Select enrichment fields
- [ ] Run enrichment process
- [ ] Verify table updates with enriched data
- [ ] Test with webhook data source

### **Security Testing**
- [ ] Test without authentication (should fail)
- [ ] Test with invalid account (should fail)
- [ ] Test with valid account (should succeed)

## 📊 **Monitoring & Alerts**

### **Key Metrics to Monitor**
- Enrichment API response times
- Enrichment success/failure rates
- Studio enrichment usage patterns
- Authentication/authorization errors

### **Error Monitoring**
- Monitor for enrichment API errors
- Monitor for authentication failures
- Monitor for rate limiting issues

## 🔄 **Rollback Plan**

### **If Issues Occur**
1. **Revert code changes** - No database changes to revert
2. **Disable enrichment feature** - Remove enrichment panel from Studio
3. **Rollback API endpoint** - Remove `/api/enrich` route

### **Rollback Commands**
```bash
# Revert to previous deployment
git revert HEAD

# Or manually disable enrichment
# Comment out enrichment panel in Studio.tsx
```

## ✅ **Success Criteria**

### **Deployment Success**
- [ ] All verification queries pass
- [ ] Enrichment API responds correctly
- [ ] Studio enrichment UI works
- [ ] Authentication/authorization works
- [ ] No database errors in logs

### **Feature Success**
- [ ] Users can select enrichment fields
- [ ] Enrichment process completes successfully
- [ ] Table updates with enriched data
- [ ] Progress tracking works
- [ ] Error handling works correctly

## 📝 **Post-Deployment Notes**

### **Documentation Updates**
- Update API documentation if needed
- Update user guides for Studio enrichment
- Document any environment-specific configurations

### **Monitoring Setup**
- Set up alerts for enrichment API errors
- Monitor usage patterns
- Track performance metrics

### **Future Enhancements**
- Replace mock API with real enrichment service
- Add usage tracking if needed
- Implement caching for better performance
- Add bulk export features

---

## 🎉 **Deployment Complete!**

The Studio enrichment feature is now ready for production use with **zero database changes required**! 