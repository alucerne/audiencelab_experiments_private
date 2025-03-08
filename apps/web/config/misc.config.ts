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
});

const miscConfig = MiscConfigSchema.parse({
  typesenseApiKey: process.env.TYPESENSE_API_KEY,
  audienceApiUrl: process.env.AUDIENCE_API_URL,
});

export default miscConfig;
