# External Enrichment API Specification

## 🎯 **Overview**

This document provides the complete specification for implementing the real-time enrichment endpoint on the external enrichment API service.

**Current API URL**: `https://v3-stg-enrich-job-72802495918.us-east1.run.app`

## 📋 **Required Endpoint**

### **POST /enrich**

**Purpose**: Real-time enrichment of individual records

**URL**: `https://v3-stg-enrich-job-72802495918.us-east1.run.app/enrich`

**Method**: `POST`

**Content-Type**: `application/json`

## 🔧 **Request Specification**

### **Request Schema**
```json
{
  "email": "john.doe@example.com",        // Optional - Primary identifier
  "domain": "example.com",                // Optional - Alternative identifier  
  "company_name": "Example Corp",         // Optional - Alternative identifier
  "enrich": ["first_name", "last_name", "company_name", "title"]  // Required - Fields to enrich
}
```

### **Request Validation Rules**
1. **At least one identifier required**: `email`, `domain`, OR `company_name`
2. **Enrichment fields required**: `enrich` array must contain at least one field
3. **Valid field names**: See "Available Enrichment Fields" below
4. **Request size limit**: Maximum 10KB per request

### **Authentication**
```http
Authorization: Bearer YOUR_API_KEY
X-Account-ID: account_id_here  // For rate limiting
```

## 📤 **Response Specification**

### **Success Response (200)**
```json
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
  "domain": "example.com",
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

### **Error Responses**

#### **400 Bad Request - Missing Identifiers**
```json
{
  "error": "At least one identifier (email, domain, or company_name) is required",
  "details": "Please ensure your data contains at least one of these fields for enrichment",
  "providedIdentifiers": {
    "email": null,
    "domain": null,
    "company_name": null
  }
}
```

#### **400 Bad Request - No Enrichment Fields**
```json
{
  "error": "No enrichment fields specified",
  "details": "Please select at least one field to enrich"
}
```

#### **401 Unauthorized**
```json
{
  "error": "Authentication required",
  "details": "Please provide a valid API key"
}
```

#### **429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "details": "Please wait before making additional requests",
  "retryAfter": 60
}
```

#### **500 Internal Server Error**
```json
{
  "error": "Enrichment service temporarily unavailable",
  "details": "Please try again later"
}
```

## 📊 **Available Enrichment Fields**

### **Personal Information**
- `first_name` - Individual's first name
- `last_name` - Individual's last name
- `age` - Individual's age
- `age_range` - Age range (e.g., "25-34")
- `gender` - Individual's gender

### **Professional Information**
- `title` - Job title
- `seniority` - Seniority level (Junior, Mid-level, Senior, etc.)
- `department` - Department name
- `years_experience` - Years of professional experience
- `headline` - Professional headline/summary

### **Company Information**
- `company_name` - Company name
- `industry` - Industry sector
- `company_size` - Company size range
- `company_revenue` - Revenue range
- `employee_count` - Number of employees
- `company_address` - Company address
- `company_city` - Company city
- `company_state` - Company state
- `company_zip` - Company zip code
- `company_phone` - Company phone number
- `company_linkedin_url` - Company LinkedIn URL

### **Contact Information**
- `phone` - Phone number
- `mobile_phone` - Mobile phone number
- `direct_number` - Direct phone number
- `personal_phone` - Personal phone number
- `personal_email` - Personal email address
- `business_email` - Business email address
- `linkedin_url` - LinkedIn profile URL
- `twitter_url` - Twitter profile URL
- `facebook_url` - Facebook profile URL

### **Location Information**
- `location` - General location
- `city` - City
- `state` - State/Province
- `country` - Country
- `zip_code` - Zip/Postal code
- `personal_address` - Personal address
- `personal_city` - Personal city
- `personal_state` - Personal state
- `personal_zip` - Personal zip code

### **Technical Information**
- `domain` - Company domain
- `technologies` - Technologies used
- `skills` - Professional skills
- `interests` - Professional interests

### **Financial Information**
- `income_range` - Income range
- `net_worth` - Net worth range
- `homeowner` - Homeowner status
- `credit_rating` - Credit rating

### **Family Information**
- `married` - Marital status
- `children` - Number of children

### **Education Information**
- `education` - Education level
- `education_history` - Education history

### **SkipTrace Information**
- `skiptrace_match_score` - SkipTrace match score
- `skiptrace_exact_age` - SkipTrace exact age
- `deep_verified_emails` - Deep verified email addresses

## 🔒 **Security Requirements**

### **Authentication**
- API key-based authentication
- Bearer token in Authorization header
- API keys should be scoped to specific accounts

### **Rate Limiting**
```typescript
const rateLimits = {
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  burstLimit: 50  // Maximum requests in a short burst
};
```

### **Input Validation**
- Sanitize all input fields
- Validate email formats
- Validate domain formats
- Prevent SQL injection
- Prevent XSS attacks

## 📈 **Performance Requirements**

### **Response Times**
- **P50**: < 500ms
- **P95**: < 2 seconds
- **P99**: < 5 seconds

### **Throughput**
- **Concurrent requests**: 1000+
- **Requests per second**: 100+

### **Availability**
- **Uptime**: 99.9%
- **Error rate**: < 0.1%

## 🔍 **Implementation Guidelines**

### **Data Sources**
1. **Primary enrichment sources**: Connect to your existing enrichment data providers
2. **Caching**: Implement Redis or similar for frequently requested data
3. **Fallback sources**: Multiple data sources for redundancy

### **Error Handling**
1. **Graceful degradation**: Return partial results when possible
2. **Retry logic**: Implement exponential backoff for transient failures
3. **Circuit breaker**: Prevent cascade failures

### **Logging & Monitoring**
```typescript
// Log these events:
- API requests with identifiers (no sensitive data)
- Response times
- Error rates and types
- Rate limit hits
- Authentication failures
- Data source availability
```

### **Caching Strategy**
```typescript
// Cache frequently requested data:
- Email-based lookups: 24 hours
- Domain-based lookups: 7 days
- Company-based lookups: 30 days
- Partial results: 1 hour
```

## 🧪 **Testing Requirements**

### **Unit Tests**
- Input validation
- Authentication
- Rate limiting
- Error handling

### **Integration Tests**
- Data source connectivity
- Caching behavior
- Response formatting

### **Load Tests**
- Concurrent request handling
- Rate limit enforcement
- Performance under load

### **Test Data**
```json
// Sample test requests:
{
  "email": "test@example.com",
  "enrich": ["first_name", "last_name", "company_name"]
}

{
  "domain": "testcompany.com",
  "enrich": ["company_name", "industry", "company_size"]
}

{
  "company_name": "Test Company Inc",
  "enrich": ["domain", "industry", "location"]
}
```

## 🚀 **Deployment Checklist**

### **Pre-deployment**
- [ ] Implement endpoint with all required fields
- [ ] Add authentication and rate limiting
- [ ] Set up monitoring and logging
- [ ] Test with sample data
- [ ] Load test the endpoint

### **Staging Deployment**
- [ ] Deploy to staging environment
- [ ] Test with real data sources
- [ ] Validate response formats
- [ ] Test error scenarios
- [ ] Monitor performance

### **Production Deployment**
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Validate response times
- [ ] Test with actual traffic
- [ ] Set up alerts

## 📞 **Integration Support**

### **Contact Information**
- **API Documentation**: [URL to be provided]
- **Support Email**: [Email to be provided]
- **Status Page**: [URL to be provided]

### **Integration Timeline**
- **Development**: 2-3 weeks
- **Testing**: 1 week
- **Staging**: 1 week
- **Production**: 1 week

### **Rollback Plan**
- Keep existing `/enrich/enqueue` endpoint unchanged
- Implement feature flags for gradual rollout
- Monitor error rates and performance
- Have rollback procedure ready

## 📝 **Example Implementation**

### **Node.js/Express Example**
```javascript
app.post('/enrich', authenticate, rateLimit, async (req, res) => {
  try {
    const { email, domain, company_name, enrich } = req.body;
    
    // Validate input
    if (!email && !domain && !company_name) {
      return res.status(400).json({
        error: 'At least one identifier required',
        details: 'Please provide email, domain, or company_name'
      });
    }
    
    if (!enrich || enrich.length === 0) {
      return res.status(400).json({
        error: 'No enrichment fields specified'
      });
    }
    
    // Enrich data
    const enrichedData = await enrichData({
      email, domain, company_name, enrich
    });
    
    res.json(enrichedData);
  } catch (error) {
    console.error('Enrichment error:', error);
    res.status(500).json({
      error: 'Enrichment service temporarily unavailable'
    });
  }
});
```

This specification provides everything needed to implement the real-time enrichment endpoint. The local API is already prepared to integrate with this endpoint once it's implemented. 