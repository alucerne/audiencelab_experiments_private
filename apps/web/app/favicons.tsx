'use client';

import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getLogosByDomainAction } from '~/lib/white-label/server-actions';

export function Favicons() {
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  const { data, isFetched } = useQuery({
    queryKey: ['icon', domain],
    queryFn: () => getLogosByDomainAction({ domain }),
    enabled: !!domain,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!isFetched) return;

    const href = data?.icon_url || '/images/favicon/favicon.ico';

    document.querySelectorAll("link[rel~='icon']").forEach((el) => el.remove());

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = href + `?v=${Date.now()}`;
    document.head.appendChild(link);
  }, [isFetched, data?.icon_url]);

  return null;
}
