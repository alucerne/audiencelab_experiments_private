'use client';

import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getLogosByDomainAction } from '~/lib/white-label/server-actions';

export function Favicons() {
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  const { data } = useQuery({
    queryKey: ['icon', domain],
    queryFn: () => getLogosByDomainAction({ domain }),
    enabled: !!domain,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!data?.icon_url) return;

    let link: HTMLLinkElement | null =
      document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = data.icon_url;
  }, [data?.icon_url]);

  return null;
}
