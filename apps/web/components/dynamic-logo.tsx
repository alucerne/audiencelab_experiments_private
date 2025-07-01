'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import { cn } from '@kit/ui/utils';

import { getLogosByDomainAction } from '~/lib/white-label/server-actions';
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

export function DynamicLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  const { data, isLoading } = useQuery({
    queryKey: ['logo', domain],
    queryFn: () => getLogosByDomainAction({ domain }),
    enabled: !!domain,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return null;
  }

  const logoSrc = data?.logo_url || logo.src;

  const image = (
    <LogoImage src={logoSrc} className={className} og={!data?.logo_url} />
  );

  if (href === null) return image;

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      {image}
    </Link>
  );
}
