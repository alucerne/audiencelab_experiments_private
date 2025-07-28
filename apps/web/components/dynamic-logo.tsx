'use server';

import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import { loadBrandingDetails } from '~/lib/server/load-branding-details';
import logo from '~/public/images/logo.png';

function LogoImage({
  src,
  className,
  og,
}: {
  src: string;
  className?: string;
  og?: boolean;
}) {
  return (
    <div
      className={cn(
        `w-40 rounded-md px-2.5 py-2 lg:w-48`,
        className,
        og && 'bg-black',
      )}
    >
      <Image
        src={src}
        alt="Logo"
        draggable="false"
        priority
        loading="eager"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
        width={192}
        height={48}
      />
    </div>
  );
}

export async function DynamicLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  const headersStore = await headers();

  const branding = await loadBrandingDetails(headersStore.get('host') || '');

  const logoSrc = branding?.logo_url || logo.src;

  const image = (
    <LogoImage src={logoSrc} className={className} og={!branding?.logo_url} />
  );

  if (href === null) return image;

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      {image}
    </Link>
  );
}
