import { AgentBase, AgentInput, AgentResult } from '../types';
import { ProfileResult } from '../types';
import { FirecrawlService } from '../services/firecrawl-service';
import { OpenAIService } from '../services/openai-service';

export class ProfileAgent implements AgentBase {
  name = 'Profile Agent';
  phase = 2;

  constructor(
    private firecrawlService: FirecrawlService,
    private openaiService: OpenAIService
  ) {}

  async execute(input: AgentInput): Promise<AgentResult> {
    try {
      const { context, companyName, domain } = input;
      
      // Use context from previous agents or fallback to input
      const targetCompany = context.companyName || companyName;
      const targetDomain = context.domain || domain;
      
      if (!targetCompany && !targetDomain) {
        return {
          success: false,
          error: 'No company name or domain available for profile analysis',
          data: {},
        };
      }

      // Build search targets using context from discovery
      const searchTargets = this.buildSearchTargets(targetCompany, targetDomain, context);
      
      // Execute parallel searches
      const searchPromises = searchTargets.map(target => 
        this.searchCompanyProfile(target, context)
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
          error: 'No successful profile search results found',
          data: {},
        };
      }

      // Synthesize results using AI with context from discovery
      const synthesizedData = await this.synthesizeResults(validResults, input, context);
      
      // Validate with Zod schema
      const validatedData = ProfileResult.parse({
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

  private buildSearchTargets(companyName?: string, domain?: string, context?: Record<string, any>): string[] {
    const targets: string[] = [];

    // Use discovered company name if available
    if (context?.companyName) {
      targets.push(context.companyName);
    } else if (companyName) {
      targets.push(companyName);
    }

    // Use discovered website if available
    if (context?.website) {
      targets.push(context.website);
    } else if (domain) {
      targets.push(`https://${domain}`);
    }

    // Add industry-specific searches if we have company info
    if (targets.length > 0) {
      const company = targets[0];
      targets.push(`${company} industry market segment`);
      targets.push(`${company} business model revenue`);
      targets.push(`${company} headquarters location`);
      targets.push(`${company} company size employees`);
    }

    return targets;
  }

  private async searchCompanyProfile(target: string, context?: Record<string, any>): Promise<any> {
    const searchQueries = [
      `${target} about us company profile`,
      `${target} industry business model`,
      `${target} headquarters location`,
      `${target} company size employees`,
      `${target} mission vision values`,
      `${target} market segment target audience`
    ];

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
      results: results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value),
    };
  }

  private async synthesizeResults(
    searchResults: any[], 
    input: AgentInput, 
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const synthesisContext = {
      searchResults,
      input,
      discoveryContext: context,
      task: 'Extract company profile information including industry, business model, market segment, headquarters, year founded, and company type'
    };

    const prompt = this.buildSynthesisPrompt(synthesisContext);
    
    const response = await this.openaiService.extractStructuredData(prompt, {
      industry: 'string',
      subCategory: 'string',
      businessModel: 'string',
      marketSegment: 'string',
      headquarters: 'string',
      yearFounded: 'string',
      companyType: 'string',
      mission: 'string',
      vision: 'string',
    });

    return response;
  }

  private buildSynthesisPrompt(context: any): string {
    return `
You are a company profile analysis agent. Analyze the provided search results and extract detailed company profile information.

Discovery Context (from previous phase):
${JSON.stringify(context.discoveryContext, null, 2)}

Search Results:
${JSON.stringify(context.searchResults, null, 2)}

Input Context:
${JSON.stringify(context.input, null, 2)}

Task: Extract the following company profile information:
- industry: Primary industry classification (e.g., Technology, Healthcare, Finance)
- subCategory: Specific sub-category within the industry
- businessModel: How the company makes money (e.g., SaaS, E-commerce, Consulting)
- marketSegment: Target market segment (e.g., Enterprise, SMB, Consumer)
- headquarters: Company headquarters location
- yearFounded: Year the company was founded
- companyType: Type of company (e.g., Private, Public, Startup, Enterprise)
- mission: Company mission statement
- vision: Company vision statement

Guidelines:
1. Use discovery context to validate and enhance profile information
2. Prioritize official company sources over third-party sources
3. Extract the most accurate and up-to-date information
4. If multiple sources conflict, choose the most authoritative source
5. Provide specific, actionable information rather than generic descriptions
6. Use industry-standard classifications when possible

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
    if (totalSources > 2) {
      confidence = Math.min(confidence + 0.3, 1.0);
    } else if (totalSources > 1) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }
    
    return Math.round(confidence * 100) / 100;
  }
} 