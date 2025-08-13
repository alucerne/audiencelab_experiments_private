import { AgentBase, AgentInput, AgentResult } from '../types';
import { FundingResult } from '../types';
import { FirecrawlService } from '../services/firecrawl-service';
import { OpenAIService } from '../services/openai-service';

export class FundingAgent implements AgentBase {
  name = 'Funding Agent';
  phase = 3;

  constructor(
    private firecrawlService: FirecrawlService,
    private openaiService: OpenAIService
  ) {}

  async execute(input: AgentInput): Promise<AgentResult> {
    try {
      const { context, companyName, domain } = input;
      
      // Use context from previous agents
      const targetCompany = context.companyName || companyName;
      const targetDomain = context.domain || domain;
      const industry = context.industry;
      
      if (!targetCompany && !targetDomain) {
        return {
          success: false,
          error: 'No company name or domain available for funding analysis',
          data: {},
        };
      }

      // Build search targets using context from previous phases
      const searchTargets = this.buildSearchTargets(targetCompany, targetDomain, context);
      
      // Execute parallel searches
      const searchPromises = searchTargets.map(target => 
        this.searchFundingInfo(target, context)
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
          error: 'No successful funding search results found',
          data: {},
        };
      }

      // Synthesize results using AI with context from previous phases
      const synthesizedData = await this.synthesizeResults(validResults, input, context);
      
      // Validate with Zod schema
      const validatedData = FundingResult.parse({
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

    // Add funding-specific search targets
    if (targets.length > 0) {
      const company = targets[0];
      const industry = context?.industry;
      
      // Basic funding searches
      targets.push(`${company} funding rounds investors`);
      targets.push(`${company} venture capital investment`);
      targets.push(`${company} funding stage valuation`);
      
      // Industry-specific searches
      if (industry) {
        targets.push(`${company} ${industry} funding investors`);
        targets.push(`${company} ${industry} startup funding`);
      }
      
      // Revenue and financial searches
      targets.push(`${company} revenue growth financials`);
      targets.push(`${company} annual revenue funding`);
    }

    return targets;
  }

  private async searchFundingInfo(target: string, context?: Record<string, any>): Promise<any> {
    const searchQueries = [
      `${target} funding rounds`,
      `${target} investors venture capital`,
      `${target} funding stage valuation`,
      `${target} revenue growth financials`,
      `${target} startup funding history`,
      `${target} investment rounds investors`
    ];

    const searchPromises = searchQueries.map(query =>
      this.firecrawlService.search(query, {
        maxPages: 3,
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
      previousContext: context,
      task: 'Extract funding and financial information including funding stage, amounts, investors, valuation, and revenue'
    };

    const prompt = this.buildSynthesisPrompt(synthesisContext);
    
    const response = await this.openaiService.extractStructuredData(prompt, {
      fundingStage: 'string',
      totalRaised: 'string',
      lastRoundAmount: 'string',
      lastRoundDate: 'string',
      investors: 'array of strings',
      valuation: 'string',
      revenue: 'string',
      growthRate: 'string',
    });

    return response;
  }

  private buildSynthesisPrompt(context: any): string {
    return `
You are a funding and financial analysis agent. Analyze the provided search results and extract detailed funding and financial information.

Previous Context (from discovery and profile phases):
${JSON.stringify(context.previousContext, null, 2)}

Search Results:
${JSON.stringify(context.searchResults, null, 2)}

Input Context:
${JSON.stringify(context.input, null, 2)}

Task: Extract the following funding and financial information:
- fundingStage: Current funding stage (e.g., Seed, Series A, Series B, etc.)
- totalRaised: Total amount of funding raised to date
- lastRoundAmount: Amount raised in the most recent funding round
- lastRoundDate: Date of the most recent funding round
- investors: List of key investors and venture capital firms
- valuation: Company valuation (if available)
- revenue: Annual revenue or revenue range
- growthRate: Revenue or user growth rate

Guidelines:
1. Use previous context to validate and enhance funding information
2. Prioritize official announcements and reputable financial sources
3. Extract specific amounts and dates when available
4. If multiple sources conflict, choose the most recent or authoritative source
5. Format amounts consistently (e.g., "$10M", "$50M - $100M")
6. Include both direct company sources and third-party financial databases
7. Be conservative with estimates - prefer specific data over ranges when possible

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