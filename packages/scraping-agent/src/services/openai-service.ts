import OpenAI from 'openai';

export interface StructuredDataSchema {
  [key: string]: string;
}

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async extractStructuredData(
    prompt: string, 
    schema: StructuredDataSchema,
    model: string = 'gpt-4o-mini'
  ): Promise<Record<string, any>> {
    try {
      const schemaDescription = Object.entries(schema)
        .map(([key, type]) => `- ${key}: ${type}`)
        .join('\n');

      const systemPrompt = `You are a data extraction specialist. Extract structured data from the provided information and return it as a valid JSON object.

Required fields and types:
${schemaDescription}

Guidelines:
1. Return only valid JSON
2. Use null for missing or unknown values
3. Ensure all required fields are present
4. Follow the exact field names and types specified
5. Extract the most accurate information available
6. If multiple sources conflict, choose the most authoritative source

Return the data in this exact JSON format:
{
${Object.entries(schema).map(([key, type]) => `  "${key}": ${type === 'string' ? 'string' : type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : 'string'}`).join(',\n')}
}`;

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      return extractedData;

    } catch (error) {
      console.error('OpenAI extraction error:', error);
      throw error;
    }
  }

  async analyzeContent(
    content: string,
    analysisType: 'sentiment' | 'topics' | 'entities' | 'summary',
    model: string = 'gpt-4o-mini'
  ): Promise<string> {
    try {
      const analysisPrompts = {
        sentiment: 'Analyze the sentiment of this content. Is it positive, negative, or neutral? Provide a brief explanation.',
        topics: 'Extract the main topics and themes from this content. List them as comma-separated values.',
        entities: 'Extract named entities (people, organizations, locations, etc.) from this content.',
        summary: 'Provide a concise summary of this content in 2-3 sentences.'
      };

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a content analysis specialist.' },
          { role: 'user', content: `${analysisPrompts[analysisType]}\n\nContent:\n${content}` }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || 'Analysis failed';
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw error;
    }
  }

  async synthesizeMultipleSources(
    sources: Array<{ content: string; url: string }>,
    synthesisType: 'company_profile' | 'financial_data' | 'tech_stack' | 'custom',
    customPrompt?: string,
    model: string = 'gpt-4o-mini'
  ): Promise<Record<string, any>> {
    try {
      const sourceText = sources
        .map(source => `Source: ${source.url}\nContent: ${source.content}`)
        .join('\n\n');

      let prompt: string;
      
      switch (synthesisType) {
        case 'company_profile':
          prompt = `Synthesize company profile information from multiple sources. Extract and combine the most accurate information about:
- Company name and official branding
- Industry and business category
- Company size and employee count
- Headquarters location
- Year founded
- Business model and value proposition
- Mission and vision statements

Sources:
${sourceText}`;
          break;
          
        case 'financial_data':
          prompt = `Extract and synthesize financial information from multiple sources. Look for:
- Funding rounds and amounts
- Total funding raised
- Key investors
- Valuation information
- Revenue figures (if public)
- Growth metrics

Sources:
${sourceText}`;
          break;
          
        case 'tech_stack':
          prompt = `Extract and synthesize technology stack information from multiple sources. Look for:
- Programming languages used
- Frameworks and libraries
- Databases and storage solutions
- Cloud providers and infrastructure
- Development tools and platforms
- Third-party integrations

Sources:
${sourceText}`;
          break;
          
        case 'custom':
          prompt = customPrompt || 'Synthesize information from the provided sources.';
          break;
          
        default:
          throw new Error(`Unknown synthesis type: ${synthesisType}`);
      }

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a data synthesis specialist. Combine information from multiple sources to create accurate, comprehensive data.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse as JSON, fallback to text
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback to structured text
      }

      return { synthesized_data: content };

    } catch (error) {
      console.error('OpenAI synthesis error:', error);
      throw error;
    }
  }

  async validateData(
    data: Record<string, any>,
    validationRules: Record<string, string>,
    model: string = 'gpt-4o-mini'
  ): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> {
    try {
      const rulesText = Object.entries(validationRules)
        .map(([field, rule]) => `- ${field}: ${rule}`)
        .join('\n');

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a data validation specialist. Validate data against provided rules and suggest improvements.' },
          { role: 'user', content: `Validate this data against the following rules:\n\nRules:\n${rulesText}\n\nData:\n${JSON.stringify(data, null, 2)}\n\nReturn a JSON response with: isValid (boolean), errors (array of error messages), suggestions (array of improvement suggestions)` }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No validation response');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        isValid: false,
        errors: ['Failed to parse validation response'],
        suggestions: []
      };

    } catch (error) {
      console.error('OpenAI validation error:', error);
      throw error;
    }
  }
} 