import { MetadataRoute } from 'next';

import appConfig from '~/config/app.config';

export default function robots(): MetadataRoute.Robots {
  // For experimental deployment, return minimal robots
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
      },
      sitemap: undefined,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${appConfig.url}/server-sitemap.xml`,
  };
}
