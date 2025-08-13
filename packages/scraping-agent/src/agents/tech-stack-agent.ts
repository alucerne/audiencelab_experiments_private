import { AgentBase, AgentInput, AgentResult } from '../types';
import { TechStackResult } from '../types';
import { FirecrawlService } from '../services/firecrawl-service';
import { OpenAIService } from '../services/openai-service';

export class TechStackAgent implements AgentBase {
  name = 'Tech Stack Agent';
  phase = 4;

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
      const website = context.website;
      
      if (!targetCompany && !targetDomain && !website) {
        return {
          success: false,
          error: 'No company name, domain, or website available for tech stack analysis',
          data: {},
        };
      }

      // Build search targets using context from previous phases
      const searchTargets = this.buildSearchTargets(targetCompany, targetDomain, website, context);
      
      // Execute parallel searches
      const searchPromises = searchTargets.map(target => 
        this.searchTechStack(target, context)
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
          error: 'No successful tech stack search results found',
          data: {},
        };
      }

      // Synthesize results using AI with context from previous phases
      const synthesizedData = await this.synthesizeResults(validResults, input, context);
      
      // Validate with Zod schema
      const validatedData = TechStackResult.parse({
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
    context?: Record<string, any>
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

    // Add tech stack-specific search targets
    if (targets.length > 0) {
      const company = targets[0];
      
      // Direct tech stack searches
      targets.push(`${company} technology stack`);
      targets.push(`${company} tech stack tools`);
      targets.push(`${company} software development stack`);
      
      // Job posting searches (often contain tech stack info)
      targets.push(`${company} job openings software engineer`);
      targets.push(`${company} careers technology requirements`);
      
      // GitHub and developer searches
      targets.push(`${company} github repositories`);
      targets.push(`${company} developer blog tech stack`);
    }

    return targets;
  }

  private async searchTechStack(target: string, context?: Record<string, any>): Promise<any> {
    const searchQueries = [
      `${target} technology stack`,
      `${target} tech stack tools`,
      `${target} software development stack`,
      `${target} job openings software engineer`,
      `${target} careers technology requirements`,
      `${target} github repositories`,
      `${target} developer blog tech stack`
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
      task: 'Extract technology stack information including programming languages, frameworks, databases, cloud providers, and tools'
    };

    const prompt = this.buildSynthesisPrompt(synthesisContext);
    
    const response = await this.openaiService.extractStructuredData(prompt, {
      programmingLanguages: 'array of strings',
      frameworks: 'array of strings',
      databases: 'array of strings',
      cloudProviders: 'array of strings',
      tools: 'array of strings',
      infrastructure: 'array of strings',
      integrations: 'array of strings',
    });

    return response;
  }

  private buildSynthesisPrompt(context: any): string {
    return `
You are a technology stack analysis agent. Analyze the provided search results and extract detailed technology stack information.

Previous Context (from discovery, profile, and funding phases):
${JSON.stringify(context.previousContext, null, 2)}

Search Results:
${JSON.stringify(context.searchResults, null, 2)}

Input Context:
${JSON.stringify(context.input, null, 2)}

Task: Extract the following technology stack information:
- programmingLanguages: Programming languages used (e.g., JavaScript, Python, Java, Go)
- frameworks: Frameworks and libraries (e.g., React, Django, Spring Boot, Express)
- databases: Databases and storage solutions (e.g., PostgreSQL, MongoDB, Redis, MySQL)
- cloudProviders: Cloud providers and infrastructure (e.g., AWS, Google Cloud, Azure, DigitalOcean)
- tools: Development tools and platforms (e.g., Docker, Kubernetes, Jenkins, GitLab)
- infrastructure: Infrastructure and deployment tools (e.g., Terraform, Ansible, Helm)
- integrations: Third-party integrations and APIs (e.g., Stripe, Twilio, Salesforce)

Guidelines:
1. Use previous context to understand the company's industry and business model
2. Look for specific technology mentions in job postings, blog posts, and documentation
3. Extract both frontend and backend technologies
4. Include version numbers when available
5. Categorize technologies appropriately (languages vs frameworks vs tools)
6. Prioritize recent and actively used technologies
7. Look for patterns that indicate the company's technical approach
8. Include both open-source and commercial technologies

Return the data in the specified JSON format with arrays of technology names.
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
    if (totalSources > 4) {
      confidence = Math.min(confidence + 0.5, 1.0);
    } else if (totalSources > 3) {
      confidence = Math.min(confidence + 0.4, 1.0);
    } else if (totalSources > 2) {
      confidence = Math.min(confidence + 0.3, 1.0);
    } else if (totalSources > 1) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }
    
    return Math.round(confidence * 100) / 100;
  }
} 