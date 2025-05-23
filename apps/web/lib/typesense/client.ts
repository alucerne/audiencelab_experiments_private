import Typesense from 'typesense';

import miscConfig from '~/config/misc.config';

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: 'xunl7rakp6819ohwp-1.a1.typesense.net',
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey: miscConfig.typesenseApiKey,
  connectionTimeoutSeconds: 20,
});
