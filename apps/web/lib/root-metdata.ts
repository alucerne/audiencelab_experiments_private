import { Metadata } from 'next';

import { headers } from 'next/headers';

import appConfig from '~/config/app.config';

import { loadBrandingDetails } from './server/load-branding-details';

/**
 * @name generateRootMetadata
 * @description Generates the root metadata for the application
 */
export const generateRootMetadata = async (): Promise<Metadata> => {
  const headersStore = await headers();
  const csrfToken = headersStore.get('x-csrf-token') ?? '';

  const branding = await loadBrandingDetails(headersStore.get('host') || '');

  return {
    title: branding?.company_name || appConfig.title,
    description: branding?.company_name || appConfig.description,
    metadataBase: branding?.domain
      ? new URL(branding.domain)
      : new URL(appConfig.url),
    applicationName: branding?.company_name || appConfig.name,
    other: {
      'csrf-token': csrfToken,
    },
    openGraph: {
      url: branding?.domain
        ? new URL(branding.domain).toString()
        : appConfig.url,
      siteName: branding?.company_name || appConfig.name,
      title: branding?.company_name || appConfig.title,
      description: branding?.company_name || appConfig.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: branding?.company_name || appConfig.title,
      description: branding?.company_name || appConfig.description,
    },
  };
};
