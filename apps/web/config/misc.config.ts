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
  googleCloud: z.object({
    projectId: z.string(),
    clientEmail: z.string(),
    privateKey: z.string(),
  }),
});

const miscConfig = MiscConfigSchema.parse({
  typesenseApiKey: process.env.TYPESENSE_API_KEY,
  audienceApiUrl: process.env.AUDIENCE_API_URL,
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export default miscConfig;
