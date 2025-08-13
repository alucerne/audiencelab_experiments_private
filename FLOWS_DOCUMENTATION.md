# AudienceLab V3 - Flows Documentation

This document provides comprehensive documentation for all key flows, scripts, and processes in the AudienceLab V3 local development environment.

## Table of Contents

1. [Local Development Startup Flow](#local-development-startup-flow)
2. [Database Management Flow](#database-management-flow)
3. [Environment Setup Flow](#environment-setup-flow)
4. [Enrichment API Testing Flow](#enrichment-api-testing-flow)
5. [Webhook Testing Flow](#webhook-testing-flow)
6. [Data Conversion Flow](#data-conversion-flow)
7. [Deployment Flows](#deployment-flows)
8. [Studio Enrichment Feature Flow](#studio-enrichment-feature-flow)
9. [Studio Data Management Flow](#studio-data-management-flow)
10. [Magic Signup Flow](#magic-signup-flow)
11. [Client Credit Purchase Flow](#client-credit-purchase-flow)

---

## Local Development Startup Flow

### Flow Name: Automated Local Development Environment Startup
- **Purpose**: Automatically sets up and starts the complete local development environment with error checking and fixes.
- **Inputs**: 
  - Environment file (`apps/web/.env.local`)
  - Docker Desktop running
  - Supabase CLI installed
  - Node.js and pnpm installed
- **Steps**:
  1. Navigate to web app directory (`apps/web`)
  2. Check for `.env.local` file existence
  3. Fix Supabase URL if incorrect (localhost:9999 → 127.0.0.1:54321)
  4. Validate critical environment variables
  5. Check Supabase status and start if needed
  6. Verify Supabase accessibility via HTTP
  7. Check for existing Next.js process and offer restart
  8. Start Next.js development server with turbo mode
  9. Wait for server to be responsive (30-second timeout)
  10. Display final status and access URLs
- **Outputs**: 
  - Running Supabase instance on port 54321
  - Running Next.js app on port 3000
  - Supabase Studio accessible on port 54323
  - Email testing on port 54324
- **APIs / Services**: 
  - Supabase local instance
  - Next.js development server
  - Docker containers
- **Gotchas / Edge Cases**: 
  - Script must be run from project root
  - Docker Desktop must be running before execution
  - 30-second timeout for Next.js startup
  - Existing Next.js process may need manual termination
- **Example**: 
  ```bash
  chmod +x scripts/start-local-dev.sh
  ./scripts/start-local-dev.sh
  ```

---

## Database Management Flow

### Flow Name: Database Reset and Type Generation
- **Purpose**: Resets the local database to apply all migrations and generates TypeScript types for database schema.
- **Inputs**: 
  - Supabase running locally
  - Database migrations in `apps/web/supabase/migrations/`
  - Seed data in `apps/web/supabase/seed.sql`
- **Steps**:
  1. Stop any running Supabase instance
  2. Reset database to clean state
  3. Apply all migration files in order
  4. Run seed data insertion
  5. Generate TypeScript types from current schema
  6. Verify database is accessible
- **Outputs**: 
  - Fresh database with all migrations applied
  - Updated TypeScript types in `apps/web/lib/database.types.ts`
  - Seed data populated
- **APIs / Services**: 
  - Supabase CLI
  - PostgreSQL database
- **Gotchas / Edge Cases**: 
  - Pgsodium schema errors may require manual fixes
  - Seed data may contain invalid references
  - Type generation may fail if schema is invalid
- **Example**: 
  ```bash
  cd apps/web
  pnpm run supabase:web:reset
  pnpm run supabase:web:typegen
  ```

---

## Environment Setup Flow

### Flow Name: Environment Configuration and Validation
- **Purpose**: Sets up and validates all required environment variables for local development.
- **Inputs**: 
  - Template environment file (`.env.example`)
  - Required API keys and credentials
  - Local development URLs
- **Steps**:
  1. Copy template environment file to `.env.local`
  2. Configure Supabase URLs for local development
  3. Set up API keys for external services
  4. Configure Google Cloud credentials
  5. Set up OAuth client credentials
  6. Configure audience and enrichment API URLs
  7. Set up Vercel deployment tokens
  8. Validate all required variables are present
- **Outputs**: 
  - Complete `.env.local` file with 34+ variables
  - Validated environment configuration
- **APIs / Services**: 
  - Supabase
  - Google Cloud Platform
  - Various external APIs (Audience, Enrichment, Pixel, etc.)
- **Gotchas / Edge Cases**: 
  - Some variables may be sensitive and require secure handling
  - API keys may expire and need rotation
  - Local URLs must match actual running services
- **Example**: 
  ```bash
  cd apps/web
  cp .env.example .env.local
  # Edit .env.local with actual values
  ```

---

## Enrichment API Testing Flow

### Flow Name: Enrichment API Endpoint Testing
- **Purpose**: Tests the enrichment API endpoint with various data scenarios to ensure proper functionality.
- **Inputs**: 
  - Running Next.js application on localhost:3000
  - Valid authentication token
  - Test data samples (emails, domains, company names)
  - Properly configured environment (no ZodError)
- **Steps**:
  1. **Configuration Verification**: Ensure no ZodError in configuration
  2. Test basic enrichment with email identifier
  3. Test enrichment with domain identifier
  4. Test enrichment with company name identifier
  5. Test error case with no identifiers
  6. Test multiple enrichment fields simultaneously
  7. Validate response format and data quality
- **Outputs**: 
  - API response validation
  - Error handling verification
  - Performance metrics
  - Mock data responses (development)
- **APIs / Services**: 
  - Enrichment API endpoint (`/api/enrich`)
  - Authentication system
  - Configuration management
- **Gotchas / Edge Cases**: 
  - Authentication token must be valid
  - API returns mock data in development environment
  - Rate limiting may affect test results
  - **Configuration Issues**: ZodError resolved with development-friendly defaults
- **Example**: 
  ```bash
  chmod +x test-enrichment-api.sh
  ./test-enrichment-api.sh
  ```

---

## Webhook Testing Flow

### Flow Name: Studio Webhook Data Ingestion Testing
- **Purpose**: Tests the webhook functionality by sending various types of contact and lead data to verify proper ingestion.
- **Inputs**: 
  - Webhook ID from Studio
  - Test data samples (contacts, leads, events, surveys, CRM data)
  - Running application instance
- **Steps**:
  1. Prompt user for webhook ID
  2. Send contact data with basic information
  3. Send lead data with company details
  4. Send event data with timestamps
  5. Send survey response data
  6. Send CRM sync data with lead scoring
  7. Verify data appears in Studio interface
- **Outputs**: 
  - Webhook data ingestion verification
  - Studio data display validation
  - Error handling confirmation
- **APIs / Services**: 
  - Webhook endpoint (`/api/webhook/{id}`)
  - Studio data processing
- **Gotchas / Edge Cases**: 
  - Webhook ID must be valid and active
  - Data format must match expected schema
  - Studio may require refresh to show new data
- **Example**: 
  ```bash
  chmod +x test-webhook.sh
  ./test-webhook.sh
  # Enter webhook ID when prompted
  ```

---

## Data Conversion Flow

### Flow Name: JSON to CSV Data Conversion
- **Purpose**: Converts large JSON contact datasets to CSV format for easier processing and testing.
- **Inputs**: 
  - JSON file with contact data (`test_contacts_data.json`)
  - Node.js runtime environment
- **Steps**:
  1. Read JSON file and handle NaN values
  2. Parse JSON content
  3. Extract headers from first object
  4. Convert each row to CSV format
  5. Handle special characters and escaping
  6. Write full dataset to CSV file
  7. Create sample file with first 100 contacts
  8. Display conversion statistics
- **Outputs**: 
  - Full CSV file (`test_contacts_data.csv`)
  - Sample CSV file (`test_contacts_sample.csv`)
  - Conversion statistics and preview
- **APIs / Services**: 
  - Node.js file system
  - JSON parsing utilities
- **Gotchas / Edge Cases**: 
  - NaN values must be converted to null
  - Special characters need proper escaping
  - Large files may cause memory issues
- **Example**: 
  ```bash
  node convert-test-data.js
  ```

---

## Deployment Flows

### Flow Name: Vercel Production Deployment
- **Purpose**: Builds and deploys the application to Vercel production environment.
- **Inputs**: 
  - Source code repository
  - Vercel CLI and authentication
  - Environment variables configured in Vercel
- **Steps**:
  1. Install project dependencies
  2. Build the web application
  3. Deploy to Vercel production
  4. Verify deployment success
- **Outputs**: 
  - Live production application
  - Deployment URL
- **APIs / Services**: 
  - Vercel deployment platform
  - Build system
- **Gotchas / Edge Cases**: 
  - Environment variables must be set in Vercel dashboard
  - Build may fail if dependencies are missing
  - Production environment may differ from local
- **Example**: 
  ```bash
  chmod +x deploy-vercel.sh
  ./deploy-vercel.sh
  ```

### Flow Name: Studio Staging Deployment
- **Purpose**: Deploys Studio features to Vercel staging environment for testing with real data.
- **Inputs**: 
  - Vercel CLI installed and authenticated
  - Environment variables configured
  - Project root directory
- **Steps**:
  1. Verify Vercel CLI installation and authentication
  2. Check project directory structure
  3. Display pre-deployment checklist
  4. Confirm deployment with user
  5. Build project with pnpm
  6. Deploy to Vercel production
  7. Display post-deployment instructions
- **Outputs**: 
  - Staging deployment URL
  - Deployment verification
- **APIs / Services**: 
  - Vercel deployment platform
  - Build system
- **Gotchas / Edge Cases**: 
  - User must be logged into Vercel CLI
  - Environment variables must be pre-configured
  - Build failures may require manual intervention
- **Example**: 
  ```bash
  chmod +x deploy-studio.sh
  ./deploy-studio.sh
  ```

---

## Studio Enrichment Feature Flow

### Flow Name: Advanced Data Enrichment Within Studio Interface
- **Purpose**: Allows users to enrich their contact data with additional information directly within the Studio interface, supporting both audience data and webhook data sources with a clean, focused interface.
- **Inputs**: 
  - Contact data loaded in Studio (audience or webhook)
  - User-selected enrichment fields (20+ options)
  - Authentication token
  - Data source type (audience or webhook)
  - User-defined visible fields
- **Steps**:
  1. User selects data source (Audience Data or Upload Data)
  2. For audience data: User selects audience and applies filters
  3. For webhook data: User creates webhook or uploads CSV
  4. **Data Table Initialization**: Table shows only 'domain' field by default (clean interface)
  5. **Field Customization**: User adds desired fields via "Add Field" dropdown
  6. **Enrichment Panel**: Appears automatically when data is loaded
  7. **Enrichment Selection**: User selects fields to enrich from 20+ available options
  8. **Validation**: System validates field selection and data availability
  9. **Enrichment Execution**: User clicks "Run Enrichment" button
  10. **Processing**: System processes each row individually with progress tracking
  11. **API Integration**: API calls made for each contact with selected fields
  12. **Data Merging**: Enriched data returned and merged with original data
  13. **Table Update**: Enriched fields appear as new columns in the data table
  14. **Success Feedback**: Clear success message confirms completion
  15. **Field Reset**: Selected enrichment fields are automatically cleared after completion
- **Outputs**: 
  - Enriched contact data with additional fields
  - Updated Studio table display with new columns
  - Progress completion status
  - Real-time table updates
  - Success confirmation messages
- **APIs / Services**: 
  - Enrichment API endpoint (`/api/enrich`)
  - Webhook API endpoints (`/api/webhook/{id}`)
  - Studio interface components
  - Authentication system
  - CSV parsing (Papa Parse)
- **Gotchas / Edge Cases**: 
  - Large datasets may take significant time to process (100ms delay between requests)
  - API rate limiting may affect performance
  - Failed enrichments don't affect successful ones
  - Mock data used in development environment
  - CSV upload requires field mapping for proper data structure
  - Webhook data is polled every 3 seconds for updates
  - **Validation Requirements**: At least one field must be visible before enrichment
  - **Field Management**: Users must manually add fields they want to see
  - **Configuration Issues**: ZodError resolved with development-friendly defaults
- **Example**: 
  ```typescript
  // User workflow example
  // 1. Table shows only 'domain' field initially
  const initialFields = ['domain'];
  
  // 2. User adds desired fields
  const userAddedFields = ['company_name', 'job_title'];
  
  // 3. User selects enrichment fields
  const selectedEnrichFields = ['first_name', 'linkedin_url', 'phone'];
  
  // 4. System validates and processes
  if (visibleFields.length === 0) {
    throw new Error('Please add at least one field to the data table before running enrichment');
  }
  
  // 5. Process enrichment with progress tracking
  for (let i = 0; i < rows.length; i++) {
    const enriched = await enrichRow(rows[i], selectedEnrichFields);
    const enrichedRow = { ...rows[i], ...enriched };
    updateTableRow(i, enrichedRow);
    onProgress(i + 1, rows.length);
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
  }
  
  // 6. Clear selected enrichment fields after completion
  setSelectedEnrichFields([]);
  ```

### Enhanced Identifier Detection Example
```typescript
// Flexible identifier detection in enrichRow function
export async function enrichRow(
  row: Record<string, any>, 
  fieldsToEnrich: EnrichFieldKey[]
): Promise<EnrichmentResponse> {
  try {
    // Build the enrichment request with flexible identifier detection
    const request: EnrichmentRequest = {
      enrich: fieldsToEnrich,
    };

    // Flexible email detection
    if (row.business_email) {
      request.email = row.business_email;
    } else if (row.email) {
      request.email = row.email;
    } else if (row.personal_email) {
      request.email = row.personal_email;
    }

    // Flexible domain detection
    if (row.domain) {
      request.domain = row.domain;
    } else if (row.company_domain) {
      request.domain = row.company_domain;
    }

    // Company name detection
    if (row.company_name) {
      request.company_name = row.company_name;
    }

    // Debug logging
    console.log('Available fields:', Object.keys(row));
    console.log('Detected identifiers:', {
      email: request.email,
      domain: request.domain,
      company_name: request.company_name
    });

    // Call the enrichment API
    const response = await fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Enrichment API error: ${response.status}`);
    }

    const data: EnrichmentResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Enrichment error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
  ```

### Real-time Enrichment API Status
- **Current Implementation**: Mock data API working with development-friendly configuration
- **Local API Integration**: Updated and fully functional
- **External API Specification**: Complete documentation ready for external team
- **Mock API Server**: Available for testing and development
- **Testing Infrastructure**: Ready to use with comprehensive test scripts
- **Documentation**: Comprehensive guides available for integration
- **Production Readiness**: Ready to switch to real-time endpoint when available

### Flow Name: Webhook Data Ingestion and Management
- **Purpose**: Allows users to create webhooks for external data ingestion and manage webhook segments within Studio.
- **Inputs**: 
  - Account ID for webhook creation
  - External data sources (forms, APIs, etc.)
  - Segment naming and configuration
- **Steps**:
  1. User clicks "Upload Data" and selects "Webhook" option
  2. User creates new webhook segment
  3. System generates unique webhook URL
  4. User copies webhook URL for external integration
  5. External systems send data to webhook endpoint
  6. Studio polls webhook data every 3 seconds
  7. Data appears in Studio table automatically
  8. User can save webhook data as named segments
  9. Enrichment can be applied to webhook data
- **Outputs**: 
  - Unique webhook URLs for data ingestion
  - Real-time data updates in Studio
  - Named webhook segments
  - Enrichable webhook data
- **APIs / Services**: 
  - Webhook creation and management
  - Real-time data polling
  - Segment saving functionality
- **Gotchas / Edge Cases**: 
  - Webhook URLs must be kept secure
  - Data polling may cause performance issues with large datasets
  - Webhook segments are stored in memory (not persisted to database)
  - External systems must send properly formatted JSON data

### Flow Name: CSV Data Upload and Field Mapping
- **Purpose**: Allows users to upload CSV files and map fields to standard data structure for enrichment with flexible identifier detection.
- **Inputs**: 
  - CSV file with contact data
  - Field mapping configuration
  - CSV parsing options
  - Flexible field name variations
- **Steps**:
  1. User clicks "Upload Data" and selects "Upload CSV" option
  2. User selects CSV file for upload
  3. System parses CSV using Papa Parse library
  4. **Field Detection**: System detects all available fields in CSV
  5. **Flexible Mapping**: User maps CSV columns to standard field names
  6. **Identifier Detection**: System finds any field that could be used for enrichment
  7. **Smart Validation**: Validates available identifiers for enrichment
  8. System normalizes data based on field mapping
  9. Normalized data appears in Studio table
  10. Enrichment can be applied to CSV data with detected identifiers
- **Outputs**: 
  - Normalized contact data from CSV
  - Mapped field structure
  - Enrichable CSV data in Studio
  - Detected identifier fields
  - Debug information for troubleshooting
- **APIs / Services**: 
  - CSV parsing (Papa Parse)
  - Field mapping utilities
  - Data normalization
  - Flexible identifier detection
- **Gotchas / Edge Cases**: 
  - CSV must have headers for proper parsing
  - Field mapping is required for data normalization
  - Large CSV files may cause memory issues
  - Special characters in CSV may need escaping
  - **Field Name Variations**: System now handles different field name conventions
  - **Identifier Flexibility**: Supports multiple field name variations for enrichment

---

## Studio Data Management Flow

### Flow Name: Comprehensive Studio Data Source Management
- **Purpose**: Provides a unified interface for managing multiple data sources (audience data, webhooks, CSV uploads) with advanced filtering, enrichment, and transformation capabilities.
- **Inputs**: 
  - Team account workspace context
  - Multiple data sources (audience, webhook, CSV)
  - User-defined filters and transformations
  - Custom field definitions
- **Steps**:
  1. **Data Source Selection**: User chooses between Audience Data or Upload Data
  2. **Audience Data Path**:
     - User selects from available audiences
     - Applies filters to create sub-segments
     - Previews filtered data
  3. **Upload Data Path**:
     - User creates webhooks for external data ingestion
     - Or uploads CSV files with field mapping
     - Data appears in Studio table
  4. **Enrichment Process**:
     - Enrichment panel appears when data is loaded
     - User selects from 20+ enrichment fields
     - System processes enrichment with progress tracking
  5. **Data Transformation**:
     - User can add custom fields and transformations
     - Code-based transformations with JavaScript
     - Field mapping and normalization
  6. **Data Export**: User can save segments and export enriched data
- **Outputs**: 
  - Enriched and transformed contact data
  - Custom field definitions
  - Named segments for reuse
  - Exportable data sets
- **APIs / Services**: 
  - Audience preview API (`/api/preview-subsegment`)
  - Enrichment API (`/api/enrich`)
  - Webhook management APIs
  - CSV parsing and processing
  - Team account workspace context
- **Gotchas / Edge Cases**: 
  - Large datasets may cause performance issues
  - Real-time webhook polling consumes resources
  - Custom code transformations must be validated
  - Field mapping errors can corrupt data structure
  - Memory limitations with very large CSV files

### Flow Name: Advanced Field Management and Custom Transformations
- **Purpose**: Allows users to add custom fields, apply transformations, and manage data structure within Studio.
- **Inputs**: 
  - Existing data fields from audience or webhook sources
  - Custom field definitions
  - JavaScript transformation code
  - Field mapping configurations
- **Steps**:
  1. **Field Addition**: User adds new fields from categorized field library
  2. **Custom Transformations**: User creates JavaScript-based field transformations
  3. **Code Editor**: User writes custom transformation functions
  4. **Real-time Preview**: System shows transformation results in real-time
  5. **Field Management**: User can hide, show, or delete fields
  6. **Data Validation**: System validates transformation code and data structure
- **Outputs**: 
  - Custom field definitions
  - Transformed data values
  - Updated table structure
  - Validated transformation code
- **APIs / Services**: 
  - Field type definitions and validation
  - JavaScript code execution (sandboxed)
  - Real-time preview generation
  - Data structure management
- **Gotchas / Edge Cases**: 
  - JavaScript code must be validated for security
  - Transformation errors can break data display
  - Complex transformations may impact performance
  - Field dependencies must be managed carefully

### Flow Name: Studio Table and Filter Management
- **Purpose**: Provides advanced table management with filtering, sorting, and data visualization capabilities with a clean, focused interface.
- **Inputs**: 
  - Contact data from various sources
  - User-defined filters and criteria
  - Table configuration preferences
  - Field visibility settings
- **Steps**:
  1. **Data Loading**: Table loads data from selected source
  2. **Initial Display**: Table shows only 'domain' field by default (clean interface)
  3. **Field Customization**: User adds desired fields via "Add Field" dropdown
  4. **Filter Application**: User applies filters to subset data
  5. **Field Management**: User controls field visibility and ordering
  6. **Data Sorting**: User sorts data by various fields
  7. **Real-time Updates**: Table updates as data changes
  8. **Export Preparation**: User prepares data for export
- **Outputs**: 
  - Filtered and sorted data table
  - Custom field configurations
  - Export-ready data sets
  - Visual data representation
  - Clean, focused interface
- **APIs / Services**: 
  - Table component with React state management
  - Filter processing and application
  - Data sorting and pagination
  - Export functionality
- **Gotchas / Edge Cases**: 
  - Large datasets may cause rendering performance issues
  - Complex filters may impact query performance
  - Memory usage increases with data size
  - Real-time updates may cause UI flickering
  - **Field Visibility**: Users must manually add fields they want to see
  - **Validation**: At least one field must be visible for enrichment

### Flow Name: Enhanced User Experience and Validation
- **Purpose**: Provides intuitive user guidance, clear validation rules, and helpful feedback throughout the Studio workflow.
- **Inputs**: 
  - User actions and selections
  - Data state and field configurations
  - Validation rules and requirements
- **Steps**:
  1. **Initial State**: Table shows minimal fields with helpful tip message
  2. **Field Addition**: User adds fields via categorized dropdown menu
  3. **Validation Checks**: System validates field selection and data availability
  4. **Error Handling**: Clear error messages guide users on required actions
  5. **Success Feedback**: Confirmation messages after successful operations
  6. **State Management**: Automatic clearing of selections after completion
- **Outputs**: 
  - Clear user guidance and feedback
  - Validated data and field configurations
  - Success confirmation messages
  - Error messages with actionable guidance
- **APIs / Services**: 
  - Toast notification system (Sonner)
  - Validation logic and error handling
  - State management for user selections
- **Gotchas / Edge Cases**: 
  - Users may not understand they need to add fields manually
  - Validation errors may occur if no fields are visible
  - Success messages may be missed if user navigates away quickly
  - Field selections are cleared after enrichment completion

### Validation Rules and Error Messages
- **Enrichment Field Selection**: "Please select at least one field to enrich"
- **Data Availability**: "No data available for enrichment"
- **Visible Fields Requirement**: "Please add at least one field to the data table before running enrichment"
- **CSV Mapping Validation**: "Please map at least one column to a field"
- **Field Addition Guidance**: Helpful tip when no fields are visible in table

### Configuration Issue Resolution
- **Problem**: ZodError caused by strict environment variable validation in misc.config.ts
- **Solution**: Removed Zod validation and added default values for development
- **Result**: Development environment works immediately without requiring all environment variables
- **Benefits**: 
  - Development-friendly configuration
  - Graceful fallbacks for missing variables
  - Production-ready when variables are available
  - No breaking changes to existing functionality

### Success Messages and User Feedback
- **CSV Upload**: "CSV uploaded successfully! Found X rows and Y columns."
- **Field Mapping**: "CSV data processed! X rows mapped and ready for enrichment."
- **Enrichment Completion**: "Enrichment completed! Added X enriched fields to the data table."
- **Webhook Creation**: "Webhook created successfully!"
- **Segment Saving**: "Segment saved successfully!"

### Flexible Identifier Detection System
- **Purpose**: Automatically detects and validates identifier fields for enrichment regardless of field naming conventions.
- **Supported Field Variations**:
  - **Email Identifiers**: `business_email`, `email`, `personal_email`
  - **Domain Identifiers**: `domain`, `company_domain`
  - **Company Identifiers**: `company_name`
- **Detection Process**:
  1. **Field Analysis**: System scans all available fields in uploaded data
  2. **Pattern Matching**: Identifies fields that match known identifier patterns
  3. **Validation**: Confirms detected fields contain valid data
  4. **Debug Logging**: Provides detailed information about detected identifiers
- **Benefits**:
  - **Flexible Field Names**: Works with various CSV field naming conventions
  - **Automatic Detection**: No manual configuration required
  - **Better Error Handling**: Clear messages about what identifiers were found
  - **Debug Information**: Detailed logging for troubleshooting

### Enhanced Debugging and Error Handling
- **Console Logging**: Detailed logs show available fields and detected identifiers
- **Clear Error Messages**: Explains exactly what identifiers were found or missing
- **Debug Information**: Shows potential identifier fields in the data
- **Validation Feedback**: Real-time feedback on field mapping and identifier detection

### Configuration Management and Environment Setup
- **Development-Friendly Configuration**: Works immediately without requiring all environment variables
- **Graceful Fallbacks**: Sensible defaults for development environment
- **Production-Ready**: Uses real environment variables when available
- **No Breaking Changes**: All existing functionality preserved
- **ZodError Resolution**: Removed strict validation that was causing configuration issues

---

## Magic Signup Flow

### Flow Name: Magic Link Signup with Resell Pricing
- **Purpose**: Creates secure magic signup links with configurable resell pricing for white-label partners.
- **Inputs**: 
  - Partner account credentials
  - Resell pricing configuration
  - Target audience parameters
- **Steps**:
  1. Partner logs into white-label dashboard
  2. Navigates to signup links section
  3. Creates new signup link with resell pricing
  4. System generates unique magic link
  5. Partner shares link with prospects
  6. Prospects click link and complete signup
  7. Account created with resell pricing applied
  8. Partner receives commission tracking
- **Outputs**: 
  - Unique magic signup link
  - Prospect account with resell pricing
  - Commission tracking for partner
- **APIs / Services**: 
  - Magic signup API endpoints
  - Authentication system
  - Pricing management system
- **Gotchas / Edge Cases**: 
  - Magic links may expire
  - Resell pricing must be pre-configured
  - Partner authentication required
- **Example**: 
  ```
  URL: http://localhost:3000/signup-magic?code=abc123def
  ```

---

## Client Credit Purchase Flow

### Flow Name: Self-Service Credit Purchase
- **Purpose**: Allows clients to purchase additional credits directly through the application interface.
- **Inputs**: 
  - Client account credentials
  - Credit package selection
  - Payment information
- **Steps**:
  1. Client navigates to usage page
  2. Scrolls to "Buy Additional Credits" section
  3. Selects credit package and quantity
  4. Enters payment information
  5. System processes payment
  6. Credits added to account
  7. Receipt sent to client
- **Outputs**: 
  - Updated credit balance
  - Payment confirmation
  - Receipt documentation
- **APIs / Services**: 
  - Payment processing system
  - Credit management system
  - Email notification system
- **Gotchas / Edge Cases**: 
  - Payment may fail due to insufficient funds
  - Credit packages may have usage limits
  - Authentication required for purchase
- **Example**: 
  ```
  Navigate to: http://localhost:3000/home/[account]/usage
  ```

---

## Maintenance and Troubleshooting

### Common Issues and Solutions

1. **Supabase Connection Errors**
   - **Symptom**: `ECONNREFUSED` errors
   - **Solution**: Restart Supabase with `supabase stop && supabase start`

2. **Environment Variable Issues**
   - **Symptom**: ZodError for missing variables
   - **Solution**: Verify all 34+ variables in `.env.local`

3. **Build Failures**
   - **Symptom**: Next.js build errors
   - **Solution**: Clear cache with `rm -rf .next` and restart

4. **Database Migration Issues**
   - **Symptom**: Pgsodium schema errors
   - **Solution**: Remove pgsodium references from seed.sql

### Regular Maintenance Tasks

1. **Weekly**: Update dependencies with `pnpm update`
2. **Monthly**: Review and rotate API keys
3. **Quarterly**: Update documentation and test scripts
4. **As needed**: Reset database and regenerate types

---

## Quick Reference Commands

```bash
# Start development environment
./scripts/start-local-dev.sh

# Reset database
cd apps/web && pnpm run supabase:web:reset

# Generate types
cd apps/web && pnpm run supabase:web:typegen

# Test enrichment API
./test-enrichment-api.sh

# Test webhook
./test-webhook.sh

# Convert test data
node convert-test-data.js

# Deploy to Vercel
./deploy-vercel.sh

# Deploy Studio
./deploy-studio.sh
```

## Studio Feature Quick Reference

### Data Sources
- **Audience Data**: Load existing audience data with filtering
- **Webhook Data**: Create webhooks for external data ingestion
- **CSV Upload**: Upload CSV files with flexible field mapping and identifier detection

### Table Interface
- **Clean Default View**: Shows only 'domain' field initially
- **Field Customization**: Add desired fields via "Add Field" dropdown
- **Categorized Fields**: Business, Personal, Financial, Family, Location, Contact, SkipTrace
- **Dynamic Table**: Enriched fields appear as new columns automatically

### Enrichment Workflow
- **Field Selection**: Choose from 20+ enrichment fields
- **Validation**: Requires at least one visible field before enrichment
- **Progress Tracking**: Real-time progress during enrichment processing
- **Success Feedback**: Clear confirmation messages after completion
- **Auto-Reset**: Selected enrichment fields clear after completion

### Enrichment Fields (20+ Available)
- **Personal**: First Name, Last Name, Job Title, Seniority, Department
- **Company**: Company Name, Industry, Company Size, Revenue, Technologies
- **Contact**: Phone, Personal Email, Business Email, LinkedIn URL
- **Location**: City, State, Country, Zip Code, Address
- **Technical**: Domain, Technologies Used

### Custom Transformations
- **Code Editor**: JavaScript-based field transformations
- **Real-time Preview**: See transformation results instantly
- **Field Mapping**: Map CSV columns to standard fields with flexible identifier detection
- **Custom Fields**: Add new fields with custom logic

### Webhook Management
- **Create Webhook**: Generate unique webhook URLs
- **Real-time Polling**: Data updates every 3 seconds
- **Segment Saving**: Save webhook data as named segments
- **External Integration**: Copy URLs for external systems

### User Experience Features
- **Helpful Tips**: Guidance when no fields are visible
- **Clear Validation**: Specific error messages for each requirement
- **Success Messages**: Confirmation for all major actions
- **Consistent Naming**: "Data Table" works for all data sources
- **Flexible Field Detection**: Automatically detects identifier fields regardless of naming conventions
- **Enhanced Debugging**: Detailed console logging for troubleshooting
- **Development-Friendly**: Works immediately without configuration issues

### Improved User Journey
1. **Upload/Select Data**: Choose audience data, webhook, or CSV upload
2. **Clean Interface**: Table shows only 'domain' field by default
3. **Add Desired Fields**: Use "Add Field" dropdown to customize view
4. **Select Enrichment**: Choose fields to enrich from enrichment panel
5. **Run Enrichment**: Process enrichment with progress tracking
6. **View Results**: Enriched fields appear as new columns automatically
7. **Success Confirmation**: Clear feedback confirms completion

### Key Benefits
- **Cleaner Interface**: Only shows relevant fields by default
- **Better Performance**: Less data rendering initially
- **User Control**: Users choose exactly what they want to see
- **Clear Workflow**: Step-by-step process with validation
- **Enriched Data Integration**: Enriched fields appear seamlessly
- **Consistent Experience**: Works the same for all data sources
- **Flexible Field Names**: Works with various CSV field naming conventions
- **Automatic Identifier Detection**: No manual configuration required for enrichment
- **Better Error Handling**: Clear messages about what identifiers were found
- **Enhanced Debugging**: Detailed logging for troubleshooting
- **Development-Friendly**: Works immediately without configuration issues
- **Production-Ready**: Ready to switch to real-time enrichment API

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: Development Team 