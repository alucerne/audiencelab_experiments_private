// Simple configuration without Zod validation for development
const isDevelopment = process.env.NODE_ENV === 'development';

const miscConfig = {
  typesenseApiKey: process.env.TYPESENSE_API_KEY || 'development-key',
  audienceApiUrl: process.env.AUDIENCE_API_URL || 'http://localhost:3000',
  enrichmentApiUrl: process.env.ENRICH_API_URL || 'https://v3-stg-enrich-job-72802495918.us-east1.run.app',
  pixelApiUrl: process.env.PIXEL_API_URL || 'http://localhost:3000',
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'development-project',
    clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 'development@example.com',
    privateKey: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'development-key',
    enrichmentBucket: process.env.GOOGLE_CLOUD_ENRICHMENT_BUCKET || 'development-bucket',
  },
  interestsApi: {
    url: process.env.INTERESTS_API_URL || 'http://localhost:3000',
    key: process.env.INTERESTS_API_KEY || 'development-key',
  },
  delivrPixel: {
    apiUrl: process.env.DELIVR_PIXEL_API_URL || 'http://localhost:3000',
    jwt: process.env.DELIVR_PIXEL_JWT || 'development-jwt',
    appClientId: process.env.DELIVR_PIXEL_APP_CLIENT_ID || 'development-client-id',
    appClientSecret: process.env.DELIVR_PIXEL_APP_CLIENT_SECRET || 'development-client-secret',
    enterpriseId: process.env.DELIVR_PIXEL_ENTERPRISE_ID || 'development-enterprise-id',
  },
  audienceSync: {
    fbSyncApiUrl: process.env.FACEBOOK_SYNC_API_URL || 'http://localhost:3000',
    googleSheetsApiUrl: process.env.GOOGLE_SHEETS_SYNC_API_URL || 'http://localhost:3000',
  },
  // Scraping Agent Configuration
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
};

export default miscConfig;
