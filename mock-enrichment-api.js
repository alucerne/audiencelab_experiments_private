#!/usr/bin/env node

/**
 * Mock External Enrichment API Server
 * 
 * This server simulates the external enrichment API for testing purposes.
 * It implements the /enrich endpoint with realistic responses and error handling.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Rate limit exceeded',
    details: 'Please wait before making additional requests',
    retryAfter: 60
  }
});
app.use(limiter);

// Authentication middleware (mock)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      details: 'Please provide a valid API key'
    });
  }
  
  const apiKey = authHeader.substring(7);
  
  // Mock API key validation
  if (apiKey !== 'test-api-key-123') {
    return res.status(401).json({
      error: 'Invalid API key',
      details: 'Please provide a valid API key'
    });
  }
  
  next();
};

// Mock enrichment data generator
function generateMockEnrichmentData(identifiers, enrichFields) {
  const data = {};
  
  // Generate consistent data based on identifiers
  const emailHash = identifiers.email ? identifiers.email.split('@')[0] : '';
  const domainHash = identifiers.domain ? identifiers.domain.split('.')[0] : '';
  const companyHash = identifiers.company_name ? identifiers.company_name.split(' ')[0] : '';
  
  const hash = (emailHash + domainHash + companyHash).toLowerCase();
  const nameIndex = hash.length % 10;
  const companyIndex = hash.length % 5;
  
  // Sample data arrays
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const companies = ['TechCorp', 'InnovateInc', 'GlobalTech', 'FutureSystems', 'DigitalSolutions'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'];
  const titles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Engineer'];
  const cities = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston'];
  const states = ['CA', 'NY', 'TX', 'WA', 'MA'];
  
  // Generate data for requested fields
  enrichFields.forEach(field => {
    switch (field) {
      case 'first_name':
        data.first_name = firstNames[nameIndex];
        break;
      case 'last_name':
        data.last_name = lastNames[nameIndex];
        break;
      case 'company_name':
        data.company_name = identifiers.company_name || `${companies[companyIndex]} Inc`;
        break;
      case 'title':
        data.title = titles[nameIndex % titles.length];
        break;
      case 'industry':
        data.industry = industries[companyIndex % industries.length];
        break;
      case 'company_size':
        data.company_size = ['10-50', '50-200', '200-1000', '1000-5000', '5000+'][companyIndex];
        break;
      case 'location':
        data.location = `${cities[nameIndex % cities.length]}, ${states[nameIndex % states.length]}`;
        break;
      case 'linkedin_url':
        data.linkedin_url = `https://linkedin.com/in/${firstNames[nameIndex].toLowerCase()}-${lastNames[nameIndex].toLowerCase()}`;
        break;
      case 'phone':
        data.phone = `+1-555-${String(nameIndex).padStart(3, '0')}-${String(companyIndex).padStart(4, '0')}`;
        break;
      case 'personal_email':
        data.personal_email = `${firstNames[nameIndex].toLowerCase()}.${lastNames[nameIndex].toLowerCase()}@gmail.com`;
        break;
      case 'business_email':
        data.business_email = identifiers.email || `${firstNames[nameIndex].toLowerCase()}@${identifiers.domain || 'example.com'}`;
        break;
      case 'domain':
        data.domain = identifiers.domain || `${companies[companyIndex].toLowerCase()}.com`;
        break;
      case 'city':
        data.city = cities[nameIndex % cities.length];
        break;
      case 'state':
        data.state = states[nameIndex % states.length];
        break;
      case 'country':
        data.country = 'United States';
        break;
      case 'zip_code':
        data.zip_code = `${10000 + (nameIndex * 1000) + (companyIndex * 100)}`;
        break;
      case 'company_revenue':
        data.company_revenue = ['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '$500M+'][companyIndex];
        break;
      case 'technologies':
        data.technologies = ['React, TypeScript, Node.js', 'Python, Django, PostgreSQL', 'Java, Spring, MySQL', 'Go, Docker, Kubernetes', 'Ruby, Rails, Redis'][nameIndex % 5];
        break;
      case 'seniority':
        data.seniority = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Principal'][nameIndex % 5];
        break;
      case 'department':
        data.department = ['Engineering', 'Product', 'Data', 'Design', 'Operations'][nameIndex % 5];
        break;
      case 'age':
        data.age = 25 + (nameIndex * 3) + (companyIndex * 2);
        break;
      case 'age_range':
        data.age_range = ['18-24', '25-34', '35-44', '45-54', '55+'][Math.floor((25 + (nameIndex * 3) + (companyIndex * 2)) / 10)];
        break;
      case 'gender':
        data.gender = nameIndex % 2 === 0 ? 'Male' : 'Female';
        break;
      case 'years_experience':
        data.years_experience = 1 + (nameIndex % 15);
        break;
      case 'headline':
        data.headline = `${titles[nameIndex % titles.length]} at ${companies[companyIndex]}`;
        break;
      case 'employee_count':
        data.employee_count = [25, 100, 500, 2000, 10000][companyIndex];
        break;
      case 'company_address':
        data.company_address = `${1000 + companyIndex * 100} Main St, ${cities[companyIndex % cities.length]}, ${states[companyIndex % states.length]}`;
        break;
      case 'company_city':
        data.company_city = cities[companyIndex % cities.length];
        break;
      case 'company_state':
        data.company_state = states[companyIndex % states.length];
        break;
      case 'company_zip':
        data.company_zip = `${20000 + (companyIndex * 1000)}`;
        break;
      case 'company_phone':
        data.company_phone = `+1-555-${String(companyIndex).padStart(3, '0')}-${String(nameIndex).padStart(4, '0')}`;
        break;
      case 'company_linkedin_url':
        data.company_linkedin_url = `https://linkedin.com/company/${companies[companyIndex].toLowerCase()}`;
        break;
      case 'mobile_phone':
        data.mobile_phone = `+1-555-${String(nameIndex + 5).padStart(3, '0')}-${String(companyIndex + 5).padStart(4, '0')}`;
        break;
      case 'direct_number':
        data.direct_number = `+1-555-${String(nameIndex + 10).padStart(3, '0')}-${String(companyIndex + 10).padStart(4, '0')}`;
        break;
      case 'personal_phone':
        data.personal_phone = `+1-555-${String(nameIndex + 15).padStart(3, '0')}-${String(companyIndex + 15).padStart(4, '0')}`;
        break;
      case 'twitter_url':
        data.twitter_url = `https://twitter.com/${firstNames[nameIndex].toLowerCase()}${lastNames[nameIndex].toLowerCase()}`;
        break;
      case 'facebook_url':
        data.facebook_url = `https://facebook.com/${firstNames[nameIndex].toLowerCase()}.${lastNames[nameIndex].toLowerCase()}`;
        break;
      case 'personal_address':
        data.personal_address = `${2000 + nameIndex * 50} Oak Ave, ${cities[nameIndex % cities.length]}, ${states[nameIndex % states.length]}`;
        break;
      case 'personal_city':
        data.personal_city = cities[nameIndex % cities.length];
        break;
      case 'personal_state':
        data.personal_state = states[nameIndex % states.length];
        break;
      case 'personal_zip':
        data.personal_zip = `${30000 + (nameIndex * 500)}`;
        break;
      case 'skills':
        data.skills = ['JavaScript, React, Node.js', 'Python, Machine Learning, Data Analysis', 'Java, Spring, Microservices', 'UI/UX Design, Figma, Prototyping', 'DevOps, AWS, Docker'][nameIndex % 5];
        break;
      case 'interests':
        data.interests = ['Technology, Innovation, Startups', 'Healthcare, Research, Science', 'Finance, Investment, Economics', 'Education, Learning, Teaching', 'Manufacturing, Engineering, Design'][nameIndex % 5];
        break;
      case 'income_range':
        data.income_range = ['$50K-$75K', '$75K-$100K', '$100K-$150K', '$150K-$200K', '$200K+'][nameIndex % 5];
        break;
      case 'net_worth':
        data.net_worth = ['$100K-$500K', '$500K-$1M', '$1M-$5M', '$5M-$10M', '$10M+'][nameIndex % 5];
        break;
      case 'homeowner':
        data.homeowner = nameIndex % 3 === 0 ? 'Yes' : 'No';
        break;
      case 'credit_rating':
        data.credit_rating = ['Excellent', 'Good', 'Fair', 'Poor'][nameIndex % 4];
        break;
      case 'married':
        data.married = nameIndex % 2 === 0 ? 'Yes' : 'No';
        break;
      case 'children':
        data.children = nameIndex % 4;
        break;
      case 'education':
        data.education = ['Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'High School Diploma', 'Associate\'s Degree'][nameIndex % 5];
        break;
      case 'education_history':
        data.education_history = `${['Stanford', 'MIT', 'Harvard', 'UC Berkeley', 'NYU'][nameIndex % 5]} - ${data.education}`;
        break;
      case 'skiptrace_match_score':
        data.skiptrace_match_score = 85 + (nameIndex % 15);
        break;
      case 'skiptrace_exact_age':
        data.skiptrace_exact_age = 25 + (nameIndex * 2) + (companyIndex * 1);
        break;
      case 'deep_verified_emails':
        data.deep_verified_emails = `${firstNames[nameIndex].toLowerCase()}.${lastNames[nameIndex].toLowerCase()}@${companies[companyIndex].toLowerCase()}.com`;
        break;
      default:
        // Unknown field - return null
        data[field] = null;
    }
  });
  
  return data;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Real-time enrichment endpoint
app.post('/enrich', authenticate, (req, res) => {
  try {
    const { email, domain, company_name, enrich } = req.body;
    
    // Validate input
    if (!email && !domain && !company_name) {
      return res.status(400).json({
        error: 'At least one identifier (email, domain, or company_name) is required',
        details: 'Please ensure your data contains at least one of these fields for enrichment',
        providedIdentifiers: {
          email: email || null,
          domain: domain || null,
          company_name: company_name || null
        }
      });
    }
    
    if (!enrich || !Array.isArray(enrich) || enrich.length === 0) {
      return res.status(400).json({
        error: 'No enrichment fields specified',
        details: 'Please select at least one field to enrich'
      });
    }
    
    // Simulate processing delay
    const delay = Math.random() * 1000 + 200; // 200-1200ms
    
    setTimeout(() => {
      // Generate enriched data
      const enrichedData = generateMockEnrichmentData(
        { email, domain, company_name },
        enrich
      );
      
      // Log the request (without sensitive data)
      console.log(`[${new Date().toISOString()}] Enrichment request processed:`, {
        identifiers: {
          hasEmail: !!email,
          hasDomain: !!domain,
          hasCompanyName: !!company_name
        },
        fieldsRequested: enrich.length,
        responseTime: `${delay.toFixed(0)}ms`
      });
      
      res.json(enrichedData);
    }, delay);
    
  } catch (error) {
    console.error('Enrichment error:', error);
    res.status(500).json({
      error: 'Enrichment service temporarily unavailable',
      details: 'Please try again later'
    });
  }
});

// Existing batch endpoint (for compatibility)
app.post('/enrich/enqueue', authenticate, (req, res) => {
  res.json({
    status: 'success',
    jobId: `job_${Date.now()}`,
    message: 'Batch enrichment job queued successfully'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Enrichment API Server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /enrich - Real-time enrichment`);
  console.log(`   POST /enrich/enqueue - Batch enrichment (existing)`);
  console.log(`🔑 API Key: test-api-key-123`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

module.exports = app; 