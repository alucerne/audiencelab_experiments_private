import type { Metadata } from 'next';

import { DevToolLayout } from '@/components/app-layout';
import { RootProviders } from '@/components/root-providers';

import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Dev Tool',
  description: 'The dev tool for Next.js app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RootProviders>
          <DevToolLayout>{children}</DevToolLayout>
        </RootProviders>
      </body>
    </html>
  );
}
