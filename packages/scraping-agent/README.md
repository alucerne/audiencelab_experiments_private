# Scraping Agent Package

A multi-agent AI-powered data enrichment system inspired by Fire Enrich, designed to extract company information from web sources using Firecrawl and OpenAI.

## Features

- **Multi-Agent Architecture**: 5 specialized agents working sequentially
- **Context Building**: Each agent builds on previous discoveries for accuracy
- **Parallel Processing**: Multiple searches run concurrently within each phase
- **Type Safety**: Full TypeScript support with Zod validation
- **Extensible Design**: Easy to add new agents or fields
- **Source Tracking**: Every data point links back to source URLs

## Agents

### 1. Discovery Agent (Phase 1)
- Establishes company basics
- Extracts: company name, website, domain, business type, description

### 2. Profile Agent (Phase 2)
- Industry and market positioning
- Extracts: industry, business model, headquarters, year founded, mission/vision

### 3. Funding Agent (Phase 3)
- Financial and funding information
- Extracts: funding stage, amounts, investors, valuation, revenue

### 4. Tech Stack Agent (Phase 4)
- Technology and infrastructure analysis
- Extracts: programming languages, frameworks, databases, cloud providers

### 5. General Agent (Phase 5)
- Custom field extraction
- Handles any user-defined fields not covered by specialized agents

## Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Usage

### Basic Usage

```typescript
import { createScrapingAgentOrchestrator } from '@kit/scraping-agent';

const orchestrator = createScrapingAgentOrchestrator({
  firecrawlApiKey: 'your-firecrawl-api-key',
  openaiApiKey: 'your-openai-api-key',
});

const result = await orchestrator.enrich({
  identifiers: {
    email: 'john@company.com',
    domain: 'company.com',
    companyName: 'Company Inc',
  },
  fields: ['company_name', 'industry', 'funding_stage'],
  customFields: ['ceo', 'competitors'],
});
```

### Integration with AudienceLab Studio

The scraping agent system is integrated into the AudienceLab Studio enrichment flow. Users can:

1. Select enrichment fields with AI scraping indicators (🤖)
2. Choose between API and AI Scraping methods
3. View real-time progress and source citations
4. Get enriched data with confidence scores

## Configuration

### Environment Variables

```bash
# Required for AI Scraping
FIRECRAWL_API_KEY=your-firecrawl-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Configuration Options

```typescript
interface ScrapingConfig {
  firecrawlApiKey: string;
  openaiApiKey: string;
  maxConcurrentRequests: number; // Default: 5
  requestDelay: number; // Default: 1000ms
  timeout: number; // Default: 30000ms
  retryAttempts: number; // Default: 3
}
```

## API Reference

### ScrapingAgentOrchestrator

Main orchestrator class that manages the sequential execution of agents.

#### Methods

- `enrich(request: EnrichmentRequest): Promise<EnrichmentResponse>`
- `getAgentCapabilities(): Array<{ name: string; phase: number; fields: string[] }>`
- `validateConfig(): { isValid: boolean; errors: string[] }`

### AgentBase Interface

Base interface that all agents implement.

```typescript
interface AgentBase {
  name: string;
  phase: number;
  execute(input: AgentInput): Promise<AgentResult>;
}
```

### Services

#### FirecrawlService
Handles web scraping operations using the Firecrawl API.

#### OpenAIService
Manages AI-powered data extraction and synthesis using OpenAI.

## Field Mapping

The system maps existing AudienceLab enrichment fields to scraping agent capabilities:

### Scrapable Fields
- `company_name` → Discovery Agent
- `company_domain` → Discovery Agent
- `industry` → Profile Agent
- `company_revenue` → Funding Agent
- `company_address` → Profile Agent
- `company_phone` → General Agent (custom)
- `company_linkedin_url` → General Agent (custom)
- `linkedin_url` → General Agent (custom)
- `twitter_url` → General Agent (custom)
- `facebook_url` → General Agent (custom)

### Non-Scrapable Fields
Personal, contact, location, financial, and SkipTrace fields are not available through web scraping and will use the existing API enrichment system.

## Error Handling

The system includes robust error handling:

- **API Failures**: Graceful fallback to mock data
- **Network Issues**: Retry logic with exponential backoff
- **Rate Limiting**: Configurable delays between requests
- **Validation**: Zod schema validation for all data structures

## Performance

- **Sequential Agent Execution**: Ensures context building and accuracy
- **Parallel Searches**: Multiple searches run concurrently within each phase
- **Caching**: Results are cached to avoid duplicate requests
- **Rate Limiting**: Configurable delays to respect API limits

## Security

- **API Key Management**: Secure handling of API keys
- **Input Validation**: All inputs are validated before processing
- **Error Sanitization**: Sensitive information is not exposed in error messages
- **Source Tracking**: All data is linked to source URLs for transparency

## Contributing

To add new agents or fields:

1. Create a new agent class implementing `AgentBase`
2. Add the agent to the orchestrator
3. Update field mappings and schemas
4. Add tests and documentation

## License

MIT License - see LICENSE file for details. 