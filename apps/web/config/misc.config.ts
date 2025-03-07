import { z } from 'zod';

const MiscConfigSchema = z.object({
  typesenseApiKey: z
    .string({
      description: `Typesense API key.`,
      required_error:
        'Typesense API key is required. Please set the `TYPESENSE_API_KEY` environment variable.',
    })
    .min(1),
});

const miscConfig = MiscConfigSchema.parse({
  typesenseApiKey: process.env.TYPESENSE_API_KEY,
});

export default miscConfig;
