import { redirect } from 'next/navigation';

import { enhanceRouteHandler } from '@kit/next/routes';

export const GET = enhanceRouteHandler(
  async () => {
    redirect('/auth/sign-in');
  },
  {
    auth: false,
  },
);
