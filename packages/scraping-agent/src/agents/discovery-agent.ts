import { AgentBase, AgentInput, AgentResult } from '../types';
import { DiscoveryResult } from '../types';
import { FirecrawlService } from '../services/firecrawl-service';
import { OpenAIService } from '../services/openai-service';

export class DiscoveryAgent implements AgentBase {
  name = 'Discovery Agent';
  phase = 1;

  constructor(
    private firecrawlService: FirecrawlService,
    private openaiService: OpenAIService
  ) {}

  async execute(input: AgentInput): Promise<AgentResult> {
    try {
      const { email, domain, companyName } = input;
      
      // Determine search targets
      const searchTargets = this.buildSearchTargets(email, domain, companyName);
      
      if (searchTargets.length === 0) {
        return {
          success: false,
          error: 'No valid search targets found',
          data: {},
        };
      }

      // Execute parallel searches
      const searchPromises = searchTargets.map(target => 
        this.searchCompany(target)
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
          error: 'No successful search results found',
          data: {},
        };
      }

      // Synthesize results using AI
      const synthesizedData = await this.synthesizeResults(validResults, input);
      
      // Validate with Zod schema
      const validatedData = DiscoveryResult.parse({
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

  private buildSearchTargets(email?: string, domain?: string, companyName?: string): string[] {
    const targets: string[] = [];

    // Extract domain from email if available
    if (email && !domain) {
      const emailDomain = email.split('@')[1];
      if (emailDomain && !this.isPersonalEmail(emailDomain)) {
        targets.push(emailDomain);
      }
    }

    // Add explicit domain
    if (domain && !this.isPersonalEmail(domain)) {
      targets.push(domain);
    }

    // Add company name for search
    if (companyName) {
      targets.push(companyName);
    }

    return targets;
  }

  private isPersonalEmail(domain: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
    ];
    return personalDomains.some(personal => 
      domain.toLowerCase().includes(personal)
    );
  }

  private async searchCompany(target: string): Promise<any> {
    const searchQueries = [
      `${target} company website`,
      `${target} about us`,
      `${target} company information`,
      `${target} business profile`
    ];

    const searchPromises = searchQueries.map(query =>
      this.firecrawlService.search(query, {
        maxPages: 3,
        includeHtml: true,
        includeMarkdown: true,
      })
    );

    const results = await Promise.allSettled(searchPromises);
    
    return {
      success: results.some(r => r.status === 'fulfilled'),
      target,
      results: results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value),
    };
  }

  private async synthesizeResults(searchResults: any[], input: AgentInput): Promise<Record<string, any>> {
    const context = {
      searchResults,
      input,
      task: 'Extract company discovery information including company name, website, domain, business type, and description'
    };

    const prompt = this.buildSynthesisPrompt(context);
    
    const response = await this.openaiService.extractStructuredData(prompt, {
      companyName: 'string',
      website: 'string (URL)',
      domain: 'string',
      businessType: 'string',
      description: 'string',
    });

    return response;
  }

  private buildSynthesisPrompt(context: any): string {
    return `
You are a company discovery agent. Analyze the provided search results and extract key company information.

Search Results:
${JSON.stringify(context.searchResults, null, 2)}

Input Context:
${JSON.stringify(context.input, null, 2)}

Task: Extract the following information:
- companyName: Official company name
- website: Primary company website URL
- domain: Company domain (without www)
- businessType: Type of business (e.g., SaaS, E-commerce, Consulting, etc.)
- description: Brief company description

Guidelines:
1. Prioritize official company websites and about pages
2. Extract the most accurate and up-to-date information
3. If multiple sources conflict, choose the most authoritative source
4. Ensure URLs are properly formatted
5. Provide concise but informative descriptions

Return the data in the specified JSON format.
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
    if (totalSources > 1) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }
    
    return Math.round(confidence * 100) / 100;
  }
} 