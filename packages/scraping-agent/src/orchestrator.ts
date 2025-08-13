import { AgentBase, AgentInput, AgentResult, EnrichmentRequest, EnrichmentResponse, ScrapingConfig } from './types';
import { DiscoveryAgent } from './agents/discovery-agent';
import { ProfileAgent } from './agents/profile-agent';
import { FundingAgent } from './agents/funding-agent';
import { TechStackAgent } from './agents/tech-stack-agent';
import { GeneralAgent } from './agents/general-agent';
import { FirecrawlService } from './services/firecrawl-service';
import { OpenAIService } from './services/openai-service';

export class ScrapingAgentOrchestrator {
  private agents: AgentBase[];
  private config: ScrapingConfig;
  private firecrawlService: FirecrawlService;
  private openaiService: OpenAIService;

  constructor(config: ScrapingConfig) {
    this.config = config;
    this.firecrawlService = new FirecrawlService(config.firecrawlApiKey);
    this.openaiService = new OpenAIService(config.openaiApiKey);
    
    // Initialize agents in order
    this.agents = [
      new DiscoveryAgent(this.firecrawlService, this.openaiService),
      new ProfileAgent(this.firecrawlService, this.openaiService),
      new FundingAgent(this.firecrawlService, this.openaiService),
      new TechStackAgent(this.firecrawlService, this.openaiService),
      new GeneralAgent(this.firecrawlService, this.openaiService),
    ];
  }

  async enrich(request: EnrichmentRequest): Promise<EnrichmentResponse> {
    const startTime = Date.now();
    const errors: string[] = [];
    const sources: string[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    try {
      // Build initial context
      const context: Record<string, any> = {};
      
      // Execute agents sequentially, building context
      for (const agent of this.agents) {
        const agentStartTime = Date.now();
        
        try {
          // Determine if this agent should run based on requested fields
          const shouldRun = this.shouldAgentRun(agent, request.fields, request.customFields);
          
          if (!shouldRun) {
            console.log(`Skipping ${agent.name} - no relevant fields requested`);
            continue;
          }

          console.log(`Executing ${agent.name} (Phase ${agent.phase})...`);
          
          // Prepare agent input with accumulated context
          const agentInput: AgentInput = {
            email: request.identifiers.email,
            domain: request.identifiers.domain,
            companyName: request.identifiers.companyName,
            context,
            customFields: request.customFields,
          };

          // Execute agent
          const result = await agent.execute(agentInput);
          totalRequests++;
          
          if (result.success) {
            successfulRequests++;
            
            // Merge agent results into context
            Object.assign(context, result.data);
            
            // Collect sources
            if (result.sources) {
              sources.push(...result.sources);
            }
            
            console.log(`${agent.name} completed successfully in ${Date.now() - agentStartTime}ms`);
          } else {
            failedRequests++;
            const errorMsg = `${agent.name} failed: ${result.error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }

          // Add delay between agents to respect rate limits
          if (this.config.requestDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.requestDelay));
          }

        } catch (error) {
          failedRequests++;
          const errorMsg = `${agent.name} threw error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Filter final results based on requested fields
      const finalData = this.filterResultsByRequestedFields(context, request.fields, request.customFields);

      const processingTime = Date.now() - startTime;

      return {
        success: successfulRequests > 0,
        data: finalData,
        sources: [...new Set(sources)], // Remove duplicates
        errors,
        metadata: {
          totalRequests,
          successfulRequests,
          failedRequests,
          processingTime,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        data: {},
        sources,
        errors: [...errors, `Orchestrator error: ${errorMsg}`],
        metadata: {
          totalRequests,
          successfulRequests,
          failedRequests,
          processingTime,
        },
      };
    }
  }

  private shouldAgentRun(agent: AgentBase, fields: string[], customFields?: string[]): boolean {
    const allFields = [...fields, ...(customFields || [])];
    
    // Field mapping for each agent
    const agentFieldMappings: Record<string, string[]> = {
      'Discovery Agent': ['company_name', 'company_domain', 'website', 'business_type', 'description'],
      'Profile Agent': ['industry', 'sub_category', 'business_model', 'market_segment', 'headquarters', 'year_founded', 'company_type', 'mission', 'vision'],
      'Funding Agent': ['funding_stage', 'total_raised', 'last_round_amount', 'last_round_date', 'investors', 'valuation', 'revenue', 'growth_rate'],
      'Tech Stack Agent': ['programming_languages', 'frameworks', 'databases', 'cloud_providers', 'tools', 'infrastructure', 'integrations'],
      'General Agent': [], // Handles custom fields
    };

    const agentFields = agentFieldMappings[agent.name] || [];
    
    // Check if any requested fields match this agent's capabilities
    const hasMatchingFields = allFields.some(field => 
      agentFields.some(agentField => 
        field.toLowerCase().includes(agentField.toLowerCase()) ||
        agentField.toLowerCase().includes(field.toLowerCase())
      )
    );

    // General Agent should run if there are custom fields or no specific matches
    if (agent.name === 'General Agent') {
      return customFields && customFields.length > 0 || !hasMatchingFields;
    }

    return hasMatchingFields;
  }

  private filterResultsByRequestedFields(
    context: Record<string, any>, 
    fields: string[], 
    customFields?: string[]
  ): Record<string, any> {
    const allRequestedFields = [...fields, ...(customFields || [])];
    const filteredData: Record<string, any> = {};

    // Map requested fields to context data
    allRequestedFields.forEach(requestedField => {
      // Try exact match first
      if (context[requestedField] !== undefined) {
        filteredData[requestedField] = context[requestedField];
        return;
      }

      // Try case-insensitive match
      const contextKey = Object.keys(context).find(key => 
        key.toLowerCase() === requestedField.toLowerCase()
      );
      
      if (contextKey) {
        filteredData[requestedField] = context[contextKey];
        return;
      }

      // Try partial match
      const partialMatch = Object.keys(context).find(key => 
        key.toLowerCase().includes(requestedField.toLowerCase()) ||
        requestedField.toLowerCase().includes(key.toLowerCase())
      );
      
      if (partialMatch) {
        filteredData[requestedField] = context[partialMatch];
      }
    });

    return filteredData;
  }

  // Method to get agent status and capabilities
  getAgentCapabilities(): Array<{ name: string; phase: number; fields: string[] }> {
    const agentFieldMappings: Record<string, string[]> = {
      'Discovery Agent': ['company_name', 'company_domain', 'website', 'business_type', 'description'],
      'Profile Agent': ['industry', 'sub_category', 'business_model', 'market_segment', 'headquarters', 'year_founded', 'company_type', 'mission', 'vision'],
      'Funding Agent': ['funding_stage', 'total_raised', 'last_round_amount', 'last_round_date', 'investors', 'valuation', 'revenue', 'growth_rate'],
      'Tech Stack Agent': ['programming_languages', 'frameworks', 'databases', 'cloud_providers', 'tools', 'infrastructure', 'integrations'],
      'General Agent': ['custom_fields'],
    };

    return this.agents.map(agent => ({
      name: agent.name,
      phase: agent.phase,
      fields: agentFieldMappings[agent.name] || [],
    }));
  }

  // Method to validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.firecrawlApiKey) {
      errors.push('Firecrawl API key is required');
    }

    if (!this.config.openaiApiKey) {
      errors.push('OpenAI API key is required');
    }

    if (this.config.maxConcurrentRequests < 1) {
      errors.push('Max concurrent requests must be at least 1');
    }

    if (this.config.requestDelay < 0) {
      errors.push('Request delay must be non-negative');
    }

    if (this.config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }

    if (this.config.retryAttempts < 0) {
      errors.push('Retry attempts must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
} 