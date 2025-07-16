import { redirect } from 'next/navigation';

import { enhanceRouteHandler } from '@kit/next/routes';

export const GET = enhanceRouteHandler(() => {
  redirect('/admin');
});
