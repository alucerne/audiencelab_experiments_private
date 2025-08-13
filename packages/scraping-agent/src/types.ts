import { z } from 'zod';

// Base agent result schema
export const BaseAgentResult = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// Discovery Agent - Phase 1
export const DiscoveryResult = BaseAgentResult.extend({
  companyName: z.string().optional(),
  website: z.string().url().optional(),
  domain: z.string().optional(),
  businessType: z.string().optional(),
  description: z.string().optional(),
});

// Company Profile Agent - Phase 2
export const ProfileResult = BaseAgentResult.extend({
  industry: z.string().optional(),
  subCategory: z.string().optional(),
  businessModel: z.string().optional(),
  marketSegment: z.string().optional(),
  headquarters: z.string().optional(),
  yearFounded: z.string().optional(),
  companyType: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
});

// Financial Intel Agent - Phase 3
export const FundingResult = BaseAgentResult.extend({
  fundingStage: z.string().optional(),
  totalRaised: z.string().optional(),
  lastRoundAmount: z.string().optional(),
  lastRoundDate: z.string().optional(),
  investors: z.array(z.string()).optional(),
  valuation: z.string().optional(),
  revenue: z.string().optional(),
  growthRate: z.string().optional(),
});

// Tech Stack Agent - Phase 4
export const TechStackResult = BaseAgentResult.extend({
  programmingLanguages: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  databases: z.array(z.string()).optional(),
  cloudProviders: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  infrastructure: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
});

// General Purpose Agent - Phase 5
export const EnrichmentResult = BaseAgentResult.extend({
  // Dynamic fields based on user requests
  [z.string()]: z.any(),
});

// Agent types
export type DiscoveryAgentResult = z.infer<typeof DiscoveryResult>;
export type ProfileAgentResult = z.infer<typeof ProfileResult>;
export type FundingAgentResult = z.infer<typeof FundingResult>;
export type TechStackAgentResult = z.infer<typeof TechStackResult>;
export type EnrichmentAgentResult = z.infer<typeof EnrichmentResult>;

// Agent base interface
export interface AgentBase {
  name: string;
  phase: number;
  execute(input: AgentInput): Promise<AgentResult>;
}

// Agent input interface
export interface AgentInput {
  email?: string;
  domain?: string;
  companyName?: string;
  context?: Record<string, any>;
  customFields?: string[];
}

// Agent result interface
export interface AgentResult {
  success: boolean;
  error?: string;
  data: Record<string, any>;
  sources?: string[];
  confidence?: number;
}

// Scraping configuration
export interface ScrapingConfig {
  firecrawlApiKey: string;
  openaiApiKey: string;
  maxConcurrentRequests: number;
  requestDelay: number;
  timeout: number;
  retryAttempts: number;
}

// Enrichment request
export interface EnrichmentRequest {
  identifiers: {
    email?: string;
    domain?: string;
    companyName?: string;
  };
  fields: string[];
  customFields?: string[];
  config?: Partial<ScrapingConfig>;
}

// Enrichment response
export interface EnrichmentResponse {
  success: boolean;
  data: Record<string, any>;
  sources: string[];
  errors: string[];
  metadata: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    processingTime: number;
  };
} 