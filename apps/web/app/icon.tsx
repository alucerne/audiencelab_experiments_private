import { headers } from 'next/headers';
import { ImageResponse } from 'next/og';

import { loadBrandingDetails } from '~/lib/server/load-branding-details';

export const size = { width: 185, height: 185 };
export const contentType = 'image/png';

export default async function Icon() {
  const headersStore = await headers();
  const host = headersStore.get('host') || '';
  const branding = await loadBrandingDetails(host);

  if (branding?.icon_url) {
    const res = await fetch(branding.icon_url);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new Response(buffer, {
        headers: { 'Content-Type': 'image/png' },
      });
    }
  }

  return new ImageResponse(
    (
      <svg
        width="185"
        height="185"
        viewBox="0 0 185 185"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="185" height="185" rx="22.5" fill="#101111" />
        <path
          d="M156.816 129.585H84.5215V151.758H156.816V129.585Z"
          fill="white"
        />
        <path d="M95.289 81.335H27.4609V103.66H95.289V81.335Z" fill="#394CFF" />
        <path
          d="M132.413 33.2422H57.4512V55.4154H132.413V33.2422Z"
          fill="white"
        />
      </svg>
    ),
    size,
  );
}
