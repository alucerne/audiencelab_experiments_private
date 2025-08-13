import axios, { AxiosInstance } from 'axios';

export interface FirecrawlSearchOptions {
  maxPages?: number;
  includeHtml?: boolean;
  includeMarkdown?: boolean;
  waitFor?: number;
  screenshot?: boolean;
  pdf?: boolean;
  onlyMainContent?: boolean;
  excludeTags?: string[];
  includeTags?: string[];
}

export interface FirecrawlSearchResult {
  url: string;
  title?: string;
  markdown?: string;
  html?: string;
  screenshot?: string;
  pdf?: string;
  statusCode: number;
  error?: string;
}

export class FirecrawlService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.firecrawl.dev',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  async search(query: string, options: FirecrawlSearchOptions = {}): Promise<FirecrawlSearchResult[]> {
    try {
      const response = await this.client.post('/scrape', {
        url: query,
        pageOptions: {
          onlyMainContent: options.onlyMainContent ?? true,
          includeHtml: options.includeHtml ?? false,
          includeMarkdown: options.includeMarkdown ?? true,
          screenshot: options.screenshot ?? false,
          pdf: options.pdf ?? false,
          waitFor: options.waitFor ?? 1000,
        },
        crawlerOptions: {
          maxPages: options.maxPages ?? 1,
          excludeTags: options.excludeTags ?? ['nav', 'footer', 'header'],
          includeTags: options.includeTags,
        },
      });

      if (response.data.success) {
        return response.data.data.map((page: any) => ({
          url: page.url,
          title: page.title,
          markdown: page.markdown,
          html: page.html,
          screenshot: page.screenshot,
          pdf: page.pdf,
          statusCode: page.statusCode || 200,
        }));
      } else {
        throw new Error(response.data.error || 'Firecrawl search failed');
      }
    } catch (error) {
      console.error('Firecrawl search error:', error);
      throw error;
    }
  }

  async scrapeUrl(url: string, options: FirecrawlSearchOptions = {}): Promise<FirecrawlSearchResult> {
    try {
      const response = await this.client.post('/scrape', {
        url,
        pageOptions: {
          onlyMainContent: options.onlyMainContent ?? true,
          includeHtml: options.includeHtml ?? false,
          includeMarkdown: options.includeMarkdown ?? true,
          screenshot: options.screenshot ?? false,
          pdf: options.pdf ?? false,
          waitFor: options.waitFor ?? 1000,
        },
      });

      if (response.data.success && response.data.data.length > 0) {
        const page = response.data.data[0];
        return {
          url: page.url,
          title: page.title,
          markdown: page.markdown,
          html: page.html,
          screenshot: page.screenshot,
          pdf: page.pdf,
          statusCode: page.statusCode || 200,
        };
      } else {
        throw new Error(response.data.error || 'Firecrawl scrape failed');
      }
    } catch (error) {
      console.error('Firecrawl scrape error:', error);
      throw error;
    }
  }

  async searchMultiple(urls: string[], options: FirecrawlSearchOptions = {}): Promise<FirecrawlSearchResult[]> {
    const results: FirecrawlSearchResult[] = [];
    
    // Process URLs in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.scrapeUrl(url, options).catch(error => ({
          url,
          statusCode: 500,
          error: error.message,
        }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
      
      // Add delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async searchWithRetry(query: string, options: FirecrawlSearchOptions = {}, maxRetries = 3): Promise<FirecrawlSearchResult[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.search(query, options);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // Helper method to extract specific data from search results
  extractDataFromResults(results: FirecrawlSearchResult[], dataType: 'text' | 'html' | 'markdown'): string {
    return results
      .filter(result => result.statusCode === 200)
      .map(result => {
        switch (dataType) {
          case 'text':
            return result.markdown || result.title || '';
          case 'html':
            return result.html || '';
          case 'markdown':
            return result.markdown || '';
          default:
            return '';
        }
      })
      .join('\n\n');
  }

  // Helper method to validate URLs
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Helper method to clean URLs
  cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch {
      return url;
    }
  }
} 