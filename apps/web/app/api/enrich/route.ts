import { NextResponse } from 'next/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { z } from 'zod';
import { getLogger } from '@kit/shared/logger';
import miscConfig from '~/config/misc.config';

// Define the enrichment request schema
const EnrichmentRequestSchema = z.object({
  email: z.string().email().optional(),
  domain: z.string().optional(),
  company_name: z.string().optional(),
  enrich: z.array(z.string()),
});

// Define the enrichment response schema
const EnrichmentResponseSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  seniority: z.string().optional(),
  department: z.string().optional(),
  linkedin_url: z.string().optional(),
  phone: z.string().optional(),
  personal_email: z.string().optional(),
  business_email: z.string().optional(),
  domain: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().optional(),
  company_revenue: z.string().optional(),
  technologies: z.string().optional(),
  error: z.string().optional(),
});

export const POST = enhanceRouteHandler(
  async function({ body, user }) {
    const logger = await getLogger();
    
    const ctx = {
      name: 'enrichment-api',
      userId: user.id,
      requestFields: body.enrich,
    };

    logger.info(ctx, 'Enrichment request started');

    try {
      // Validate that we have at least one identifier - be more flexible
      const hasEmail = body.email && body.email.trim() !== '';
      const hasDomain = body.domain && body.domain.trim() !== '';
      const hasCompanyName = body.company_name && body.company_name.trim() !== '';
      
      if (!hasEmail && !hasDomain && !hasCompanyName) {
        logger.warn(ctx, 'No valid identifiers provided for enrichment', {
          providedIdentifiers: {
            email: body.email,
            domain: body.domain,
            company_name: body.company_name
          }
        });
        return NextResponse.json(
          { 
            error: 'At least one identifier (email, domain, or company_name) is required',
            details: 'Please ensure your data contains at least one of these fields for enrichment',
            providedIdentifiers: {
              email: body.email,
              domain: body.domain,
              company_name: body.company_name
            }
          },
          { status: 400 }
        );
      }

      // Validate that we have fields to enrich
      if (!body.enrich || body.enrich.length === 0) {
        logger.warn(ctx, 'No enrichment fields specified');
        return NextResponse.json(
          { 
            error: 'No enrichment fields specified',
            details: 'Please select at least one field to enrich'
          },
          { status: 400 }
        );
      }

      logger.info(ctx, 'Enrichment request validated successfully', {
        identifiers: {
          hasEmail,
          hasDomain,
          hasCompanyName
        },
        fieldsToEnrich: body.enrich
      });

      // Try to call the real enrichment API
      try {
        logger.info(ctx, 'Calling external enrichment API');
        
        const response = await fetch(`${miscConfig.enrichmentApiUrl}/enrich`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Add any necessary authentication headers here
            // 'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const enrichedData = await response.json();
          logger.info(ctx, 'External enrichment API call successful');
          return NextResponse.json(enrichedData);
        } else {
          logger.warn(ctx, 'External enrichment API returned error', {
            status: response.status,
            statusText: response.statusText
          });
          
          // Fall back to mock data for 4xx/5xx errors
          const mockEnrichment = generateMockEnrichment(body);
          logger.info(ctx, 'Falling back to mock enrichment data');
          return NextResponse.json(mockEnrichment);
        }
      } catch (fetchError) {
        logger.warn(ctx, 'External enrichment API call failed, using mock data', {
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        });
        
        // Fall back to mock data for network errors
        const mockEnrichment = generateMockEnrichment(body);
        logger.info(ctx, 'Using mock enrichment data due to API failure');
        return NextResponse.json(mockEnrichment);
      }
    } catch (error) {
      logger.error({ ...ctx, error }, 'Enrichment request failed');
      return NextResponse.json(
        { 
          error: 'Enrichment service temporarily unavailable',
          details: 'Please try again later or contact support if the issue persists'
        },
        { status: 500 }
      );
    }
  },
  {
    auth: true,
    schema: EnrichmentRequestSchema,
  }
);

// Mock enrichment function - replace with actual API call
function generateMockEnrichment(request: z.infer<typeof EnrichmentRequestSchema>) {
  const enrichment: z.infer<typeof EnrichmentResponseSchema> = {};
  
  // Generate mock data based on requested fields
  request.enrich.forEach(field => {
    switch (field) {
      case 'first_name':
        enrichment.first_name = 'John';
        break;
      case 'last_name':
        enrichment.last_name = 'Doe';
        break;
      case 'company_name':
        enrichment.company_name = request.company_name || 'Example Corp';
        break;
      case 'title':
        enrichment.title = 'Software Engineer';
        break;
      case 'location':
        enrichment.location = 'San Francisco, CA';
        break;
      case 'industry':
        enrichment.industry = 'Technology';
        break;
      case 'company_size':
        enrichment.company_size = '100-500';
        break;
      case 'seniority':
        enrichment.seniority = 'Mid-level';
        break;
      case 'department':
        enrichment.department = 'Engineering';
        break;
      case 'linkedin_url':
        enrichment.linkedin_url = 'https://linkedin.com/in/johndoe';
        break;
      case 'phone':
        enrichment.phone = '+1-555-0123';
        break;
      case 'personal_email':
        enrichment.personal_email = 'john.doe@gmail.com';
        break;
      case 'business_email':
        enrichment.business_email = request.email || 'john.doe@example.com';
        break;
      case 'domain':
        enrichment.domain = request.domain || 'example.com';
        break;
      case 'city':
        enrichment.city = 'San Francisco';
        break;
      case 'state':
        enrichment.state = 'CA';
        break;
      case 'country':
        enrichment.country = 'United States';
        break;
      case 'zip_code':
        enrichment.zip_code = '94105';
        break;
      case 'company_revenue':
        enrichment.company_revenue = '$10M-$50M';
        break;
      case 'technologies':
        enrichment.technologies = 'React, TypeScript, Node.js';
        break;
    }
  });
  
  return enrichment;
} 