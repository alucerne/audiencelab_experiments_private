import { z } from 'zod';

const MiscConfigSchema = z.object({
  typesenseApiKey: z
    .string({
      description: `Typesense API key.`,
      required_error:
        'Typesense API key is required. Please set the `TYPESENSE_API_KEY` environment variable.',
    })
    .min(1),
  audienceApiUrl: z.string({
    description: `Audience API URL.`,
    required_error:
      'Audience API URL is required. Please set the `AUDIENCE_API_URL` environment variable.',
  }),
  enrichmentApiUrl: z.string({
    description: `Enrichment API URL.`,
    required_error:
      'Enrichment API URL is required. Please set the `ENRICH_API_URL` environment variable.',
  }),
  googleCloud: z.object({
    projectId: z.string(),
    clientEmail: z.string(),
    privateKey: z.string(),
    enrichmentBucket: z.string({
      description: `Google Cloud Storage bucket name for enrichment.`,
      required_error:
        'Google Cloud Storage bucket name is required. Please set the `GOOGLE_CLOUD_ENRICHMENT_BUCKET` environment variable.',
    }),
  }),
  interestsApi: z.object({
    url: z.string({
      description: `Interests API URL.`,
      required_error:
        'Interests API URL is required. Please set the `INTERESTS_API_URL` environment variable.',
    }),
    key: z.string({
      description: `Interests API key.`,
      required_error:
        'Interests API key is required. Please set the `INTERESTS_API_KEY` environment variable.',
    }),
  }),
});

const miscConfig = MiscConfigSchema.parse({
  typesenseApiKey: process.env.TYPESENSE_API_KEY,
  audienceApiUrl: process.env.AUDIENCE_API_URL,
  enrichmentApiUrl: process.env.ENRICH_API_URL,
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    enrichmentBucket: process.env.GOOGLE_CLOUD_ENRICHMENT_BUCKET,
  },
  interestsApi: {
    url: process.env.INTERESTS_API_URL,
    key: process.env.INTERESTS_API_KEY,
  },
});

export default miscConfig;
