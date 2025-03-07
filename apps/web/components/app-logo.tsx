import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import logo from '~/public/images/logo.png';

function LogoImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(`w-40 rounded-md bg-black px-2.5 py-2 lg:w-48`, className)}
    >
      <Image
        src={logo}
        alt="Audience Lab Logo"
        draggable="false"
        priority
        loading="eager"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
      />
    </div>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
