# Real-time Enrichment API Implementation Guide

## 🎯 **Overview**

This document outlines the complete process for implementing a real-time enrichment endpoint to replace the current mock data system with actual enrichment capabilities.

## 📋 **Current State**

### **What We Have**
- ✅ Local mock enrichment API at `/api/enrich` (working)
- ✅ Batch enrichment API at external URL `/enrich/enqueue` (working)
- ✅ Studio integration ready
- ✅ Fallback to mock data implemented

### **What We Need**
- ❌ Real-time enrichment endpoint at external API (`/enrich`)
- ❌ Authentication/authorization for external API
- ❌ Rate limiting and error handling

## 🔧 **Implementation Steps**

### **Step 1: External API Development**

#### **1.1 Create `/enrich` Endpoint**

The external enrichment API needs a new real-time endpoint:

```typescript
// Endpoint: https://v3-stg-enrich-job-72802495918.us-east1.run.app/enrich
POST /enrich

// Request Schema
{
  "email": "john.doe@example.com",        // Optional
  "domain": "example.com",                // Optional  
  "company_name": "Example Corp",         // Optional
  "enrich": ["first_name", "last_name", "company_name", "title"]
}

// Response Schema
{
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Example Corp", 
  "title": "Software Engineer",
  "industry": "Technology",
  "company_size": "100-500",
  "location": "San Francisco, CA",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "phone": "+1-555-0123",
  "personal_email": "john.doe@gmail.com",
  "business_email": "john.doe@example.com",
  "city": "San Francisco",
  "state": "CA",
  "country": "United States",
  "zip_code": "94105",
  "company_revenue": "$10M-$50M",
  "technologies": "React, TypeScript, Node.js",
  "seniority": "Mid-level",
  "department": "Engineering"
}
```

#### **1.2 Implementation Requirements**

```bash
# External API needs to implement:

1. Authentication/Authorization
   - API key validation
   - Rate limiting per account
   - Request logging

2. Input Validation
   - At least one identifier required (email, domain, company_name)
   - Valid enrichment field names
   - Request size limits

3. Real-time Data Enrichment
   - Connect to enrichment data sources
   - Cache frequently requested data
   - Handle partial matches

4. Error Handling
   - Invalid identifiers
   - Rate limit exceeded
   - Service unavailable
   - Partial enrichment results

5. Response Formatting
   - Consistent field names
   - Null handling for missing data
   - Error messages in response
```

### **Step 2: Local API Integration**

#### **2.1 Updated Local API**

The local API now calls the external API with fallback:

```typescript
// apps/web/app/api/enrich/route.ts
export const POST = enhanceRouteHandler(
  async function({ body, user }) {
    // 1. Validate input
    // 2. Call external API
    // 3. Handle success/error responses
    // 4. Fallback to mock data if needed
  }
);
```

#### **2.2 Error Handling Strategy**

```typescript
// Priority order for responses:
1. External API success → Return real data
2. External API 4xx error → Fallback to mock data
3. External API 5xx error → Fallback to mock data  
4. Network error → Fallback to mock data
5. Local validation error → Return 400 with details
```

### **Step 3: Authentication & Security**

#### **3.1 API Key Management**

```typescript
// Add to environment variables
ENRICH_API_KEY=your_api_key_here

// Add to API calls
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.ENRICH_API_KEY}`,
  'X-Account-ID': accountId, // For rate limiting
}
```

#### **3.2 Rate Limiting**

```typescript
// Implement rate limiting per account
const rateLimit = {
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  requestsPerDay: 10000
};
```

### **Step 4: Testing & Validation**

#### **4.1 Test Scripts**

```bash
# Test the integration
chmod +x test-realtime-enrichment.sh
./test-realtime-enrichment.sh
```

#### **4.2 Test Scenarios**

```bash
# Test scenarios to cover:
1. Valid enrichment requests
2. Invalid identifiers
3. Network failures
4. Rate limiting
5. Authentication errors
6. Partial enrichment results
```

## 🚀 **Deployment Process**

### **Phase 1: External API Development**
```bash
1. Implement /enrich endpoint on external API
2. Add authentication and rate limiting
3. Test with sample data
4. Deploy to staging environment
```

### **Phase 2: Local Integration**
```bash
1. Update local API to call external endpoint
2. Add environment variables for API key
3. Test fallback mechanisms
4. Deploy to staging
```

### **Phase 3: Production Rollout**
```bash
1. Deploy external API to production
2. Update local API in production
3. Monitor performance and errors
4. Gradually increase traffic
```

## 📊 **Monitoring & Observability**

### **Key Metrics**
```typescript
// Track these metrics:
- API response times
- Success/failure rates
- Rate limit hits
- Fallback usage
- Error types and frequencies
```

### **Logging**
```typescript
// Log important events:
- API calls to external service
- Response status codes
- Fallback triggers
- Authentication failures
- Rate limit violations
```

## 🔄 **Fallback Strategy**

### **Graceful Degradation**
```typescript
// When external API fails:
1. Log the failure with context
2. Return mock data immediately
3. Show user-friendly message
4. Retry logic for transient failures
```

### **Mock Data Quality**
```typescript
// Ensure mock data is:
- Realistic and varied
- Based on input identifiers
- Consistent across requests
- Clearly marked as mock data
```

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Real-time enrichment works for valid requests
- ✅ Graceful fallback to mock data on failures
- ✅ Proper error messages for invalid requests
- ✅ Rate limiting prevents abuse
- ✅ Authentication secures the API

### **Performance Requirements**
- ✅ Response time < 2 seconds for real API
- ✅ Response time < 100ms for mock fallback
- ✅ 99.9% uptime for external API
- ✅ Graceful handling of 1000+ concurrent requests

### **User Experience**
- ✅ Studio enrichment works seamlessly
- ✅ Users can't tell the difference between real/mock data
- ✅ Clear feedback when enrichment is processing
- ✅ No disruption to existing workflows

## 🔧 **Implementation Checklist**

### **External API Tasks**
- [ ] Create `/enrich` endpoint
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Deploy to staging
- [ ] Test with real data
- [ ] Deploy to production

### **Local API Tasks**
- [ ] Update API route to call external service
- [ ] Add environment variables
- [ ] Implement fallback logic
- [ ] Add comprehensive logging
- [ ] Test all scenarios
- [ ] Deploy to staging
- [ ] Deploy to production

### **Testing Tasks**
- [ ] Create test scripts
- [ ] Test all error scenarios
- [ ] Load test the system
- [ ] Validate fallback behavior
- [ ] Test authentication
- [ ] Test rate limiting

## 📝 **Next Steps**

1. **Immediate**: Implement external API `/enrich` endpoint
2. **Short-term**: Add authentication and rate limiting
3. **Medium-term**: Deploy and test in staging
4. **Long-term**: Monitor and optimize performance

## 🆘 **Troubleshooting**

### **Common Issues**
```bash
# External API returns 404
- Check endpoint URL
- Verify API is deployed
- Check authentication

# Rate limiting errors
- Implement exponential backoff
- Add retry logic
- Monitor usage patterns

# Authentication failures
- Verify API key
- Check key permissions
- Validate request format
```

This implementation provides a robust, scalable solution for real-time enrichment while maintaining backward compatibility and user experience. 