import Typesense from 'typesense';
import { z } from 'zod';

const apiKey = z
  .string({
    description: `Typesense API key.`,
    required_error:
      'Typesense API key is required. Please set the `TYPESENSE_API_KEY` environment variable.',
  })
  .parse(process.env.TYPESENSE_API_KEY);

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: 'xunl7rakp6819ohwp-1.a1.typesense.net',
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey,
  connectionTimeoutSeconds: 2,
});
