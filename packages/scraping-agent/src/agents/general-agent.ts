import { AgentBase, AgentInput, AgentResult } from '../types';
import { EnrichmentResult } from '../types';
import { FirecrawlService } from '../services/firecrawl-service';
import { OpenAIService } from '../services/openai-service';

export class GeneralAgent implements AgentBase {
  name = 'General Agent';
  phase = 5;

  constructor(
    private firecrawlService: FirecrawlService,
    private openaiService: OpenAIService
  ) {}

  async execute(input: AgentInput): Promise<AgentResult> {
    try {
      const { context, companyName, domain, customFields } = input;
      
      // Use context from previous agents
      const targetCompany = context.companyName || companyName;
      const targetDomain = context.domain || domain;
      const website = context.website;
      
      if (!targetCompany && !targetDomain && !website) {
        return {
          success: false,
          error: 'No company name, domain, or website available for general analysis',
          data: {},
        };
      }

      // If no custom fields, skip this agent
      if (!customFields || customFields.length === 0) {
        return {
          success: true,
          data: {},
          sources: [],
          confidence: 1.0,
        };
      }

      // Build search targets using context from previous phases
      const searchTargets = this.buildSearchTargets(targetCompany, targetDomain, website, context, customFields);
      
      // Execute parallel searches
      const searchPromises = searchTargets.map(target => 
        this.searchCustomFields(target, context, customFields)
      );
      
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Process and synthesize results
      const validResults = searchResults
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value);

      if (validResults.length === 0) {
        return {
          success: false,
          error: 'No successful custom field search results found',
          data: {},
        };
      }

      // Synthesize results using AI with context from previous phases
      const synthesizedData = await this.synthesizeResults(validResults, input, context, customFields);
      
      // Validate with Zod schema
      const validatedData = EnrichmentResult.parse({
        success: true,
        ...synthesizedData,
      });

      return {
        success: true,
        data: validatedData,
        sources: this.extractSources(validResults),
        confidence: this.calculateConfidence(validResults),
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {},
      };
    }
  }

  private buildSearchTargets(
    companyName?: string, 
    domain?: string, 
    website?: string, 
    context?: Record<string, any>,
    customFields?: string[]
  ): string[] {
    const targets: string[] = [];

    // Use discovered website if available
    if (context?.website) {
      targets.push(context.website);
    } else if (website) {
      targets.push(website);
    }

    // Use discovered company name if available
    if (context?.companyName) {
      targets.push(context.companyName);
    } else if (companyName) {
      targets.push(companyName);
    }

    // Add custom field-specific search targets
    if (targets.length > 0 && customFields) {
      const company = targets[0];
      
      // Generate search queries for each custom field
      customFields.forEach(field => {
        const searchQuery = this.generateSearchQueryForField(company, field, context);
        if (searchQuery) {
          targets.push(searchQuery);
        }
      });
    }

    return targets;
  }

  private generateSearchQueryForField(company: string, field: string, context?: Record<string, any>): string | null {
    // Map common field patterns to search strategies
    const fieldMappings: Record<string, string> = {
      // Leadership fields
      'ceo': `${company} CEO founder leadership`,
      'founder': `${company} founder CEO leadership`,
      'executives': `${company} executives leadership team`,
      'management': `${company} management team executives`,
      
      // Contact fields
      'contact': `${company} contact information`,
      'phone': `${company} phone number contact`,
      'address': `${company} address location headquarters`,
      
      // Social media fields
      'linkedin': `${company} LinkedIn profile`,
      'twitter': `${company} Twitter social media`,
      'facebook': `${company} Facebook social media`,
      
      // Business fields
      'competitors': `${company} competitors competition`,
      'partners': `${company} partners partnerships`,
      'clients': `${company} clients customers case studies`,
      'products': `${company} products services offerings`,
      
      // Location fields
      'locations': `${company} locations offices`,
      'countries': `${company} international countries markets`,
      
      // Industry fields
      'market': `${company} market industry analysis`,
      'sector': `${company} sector industry classification`,
      
      // Financial fields
      'revenue': `${company} revenue financials`,
      'profit': `${company} profit earnings financials`,
      'employees': `${company} employees company size`,
      
      // Technology fields
      'platform': `${company} platform technology`,
      'api': `${company} API integrations`,
      'mobile': `${company} mobile app`,
      
      // Marketing fields
      'brand': `${company} brand marketing`,
      'advertising': `${company} advertising marketing`,
      'campaigns': `${company} marketing campaigns`,
    };

    // Try exact match first
    if (fieldMappings[field.toLowerCase()]) {
      return fieldMappings[field.toLowerCase()];
    }

    // Try partial matches
    for (const [key, query] of Object.entries(fieldMappings)) {
      if (field.toLowerCase().includes(key) || key.includes(field.toLowerCase())) {
        return query;
      }
    }

    // Generic fallback
    return `${company} ${field}`;
  }

  private async searchCustomFields(
    target: string, 
    context?: Record<string, any>, 
    customFields?: string[]
  ): Promise<any> {
    if (!customFields || customFields.length === 0) {
      return { success: false, target, results: [] };
    }

    const searchQueries = customFields.map(field => 
      this.generateSearchQueryForField(target, field, context) || `${target} ${field}`
    );

    const searchPromises = searchQueries.map(query =>
      this.firecrawlService.search(query, {
        maxPages: 2,
        includeHtml: true,
        includeMarkdown: true,
        onlyMainContent: true,
      })
    );

    const results = await Promise.allSettled(searchPromises);
    
    return {
      success: results.some(r => r.status === 'fulfilled'),
      target,
      customFields,
      results: results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value),
    };
  }

  private async synthesizeResults(
    searchResults: any[], 
    input: AgentInput, 
    context: Record<string, any>,
    customFields?: string[]
  ): Promise<Record<string, any>> {
    if (!customFields || customFields.length === 0) {
      return {};
    }

    const synthesisContext = {
      searchResults,
      input,
      previousContext: context,
      customFields,
      task: `Extract custom field information: ${customFields.join(', ')}`
    };

    const prompt = this.buildSynthesisPrompt(synthesisContext);
    
    // Create dynamic schema based on custom fields
    const schema: Record<string, string> = {};
    customFields.forEach(field => {
      schema[field] = 'string';
    });
    
    const response = await this.openaiService.extractStructuredData(prompt, schema);

    return response;
  }

  private buildSynthesisPrompt(context: any): string {
    const customFieldsList = context.customFields.join(', ');
    
    return `
You are a general data extraction agent. Analyze the provided search results and extract information for the requested custom fields.

Previous Context (from all previous phases):
${JSON.stringify(context.previousContext, null, 2)}

Search Results:
${JSON.stringify(context.searchResults, null, 2)}

Input Context:
${JSON.stringify(context.input, null, 2)}

Task: Extract information for the following custom fields:
${customFieldsList}

Guidelines:
1. Use all available context from previous phases to enhance extraction accuracy
2. Extract specific, factual information rather than generic descriptions
3. If a field cannot be found, return null or an empty string
4. Prioritize official company sources over third-party sources
5. Look for patterns and relationships between different pieces of information
6. Be consistent with data formats (dates, numbers, etc.)
7. Extract the most recent and accurate information available
8. Consider the company's industry and business model when interpreting data

For each custom field, extract the most relevant and accurate information available in the search results.

Return the data in the specified JSON format with the exact field names requested.
    `;
  }

  private extractSources(searchResults: any[]): string[] {
    const sources: string[] = [];
    
    searchResults.forEach(result => {
      if (result.results) {
        result.results.forEach((page: any) => {
          if (page.url) {
            sources.push(page.url);
          }
        });
      }
    });

    return [...new Set(sources)]; // Remove duplicates
  }

  private calculateConfidence(searchResults: any[]): number {
    if (searchResults.length === 0) return 0;
    
    // Calculate confidence based on number of successful searches and result quality
    const totalSearches = searchResults.length;
    const successfulSearches = searchResults.filter(r => r.success).length;
    
    // Base confidence on success rate
    let confidence = successfulSearches / totalSearches;
    
    // Boost confidence if we have multiple sources
    const totalSources = this.extractSources(searchResults).length;
    if (totalSources > 3) {
      confidence = Math.min(confidence + 0.4, 1.0);
    } else if (totalSources > 2) {
      confidence = Math.min(confidence + 0.3, 1.0);
    } else if (totalSources > 1) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }
    
    return Math.round(confidence * 100) / 100;
  }
} 