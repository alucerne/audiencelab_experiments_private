// Main exports for the scraping agent package
export { ScrapingAgentOrchestrator } from './orchestrator';
export { DiscoveryAgent } from './agents/discovery-agent';
export { ProfileAgent } from './agents/profile-agent';
export { FundingAgent } from './agents/funding-agent';
export { TechStackAgent } from './agents/tech-stack-agent';
export { GeneralAgent } from './agents/general-agent';
export { FirecrawlService } from './services/firecrawl-service';
export { OpenAIService } from './services/openai-service';

// Type exports
export type {
  AgentBase,
  AgentInput,
  AgentResult,
  ScrapingConfig,
  EnrichmentRequest,
  EnrichmentResponse,
  DiscoveryAgentResult,
  ProfileAgentResult,
  FundingAgentResult,
  TechStackAgentResult,
  EnrichmentAgentResult,
} from './types';

// Schema exports
export {
  DiscoveryResult,
  ProfileResult,
  FundingResult,
  TechStackResult,
  EnrichmentResult,
} from './types';

// Service type exports
export type {
  FirecrawlSearchOptions,
  FirecrawlSearchResult,
  StructuredDataSchema,
} from './services/firecrawl-service';

// Factory function for easy integration
export function createScrapingAgentOrchestrator(config: {
  firecrawlApiKey: string;
  openaiApiKey: string;
  maxConcurrentRequests?: number;
  requestDelay?: number;
  timeout?: number;
  retryAttempts?: number;
}) {
  const defaultConfig = {
    maxConcurrentRequests: 5,
    requestDelay: 1000,
    timeout: 30000,
    retryAttempts: 3,
  };

  const fullConfig = { ...defaultConfig, ...config };
  
  return new ScrapingAgentOrchestrator(fullConfig);
}

// Utility function for field mapping
export function mapFieldsToAgents(fields: string[]): Record<string, string[]> {
  const agentFieldMappings: Record<string, string[]> = {
    'Discovery Agent': ['company_name', 'company_domain', 'website', 'business_type', 'description'],
    'Profile Agent': ['industry', 'sub_category', 'business_model', 'market_segment', 'headquarters', 'year_founded', 'company_type', 'mission', 'vision'],
    'Funding Agent': ['funding_stage', 'total_raised', 'last_round_amount', 'last_round_date', 'investors', 'valuation', 'revenue', 'growth_rate'],
    'Tech Stack Agent': ['programming_languages', 'frameworks', 'databases', 'cloud_providers', 'tools', 'infrastructure', 'integrations'],
    'General Agent': [],
  };

  const fieldToAgent: Record<string, string[]> = {};
  
  fields.forEach(field => {
    const matchingAgents: string[] = [];
    
    Object.entries(agentFieldMappings).forEach(([agentName, agentFields]) => {
      const hasMatch = agentFields.some(agentField => 
        field.toLowerCase().includes(agentField.toLowerCase()) ||
        agentField.toLowerCase().includes(field.toLowerCase())
      );
      
      if (hasMatch) {
        matchingAgents.push(agentName);
      }
    });
    
    // If no specific agent matches, assign to General Agent
    if (matchingAgents.length === 0) {
      matchingAgents.push('General Agent');
    }
    
    fieldToAgent[field] = matchingAgents;
  });
  
  return fieldToAgent;
}

// Validation utilities
export function validateEnrichmentRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.identifiers) {
    errors.push('Identifiers are required');
  } else {
    const { email, domain, companyName } = request.identifiers;
    if (!email && !domain && !companyName) {
      errors.push('At least one identifier (email, domain, or companyName) is required');
    }
  }
  
  if (!request.fields || !Array.isArray(request.fields) || request.fields.length === 0) {
    errors.push('Fields array is required and must not be empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Default configuration
export const DEFAULT_SCRAPING_CONFIG = {
  maxConcurrentRequests: 5,
  requestDelay: 1000,
  timeout: 30000,
  retryAttempts: 3,
} as const; 