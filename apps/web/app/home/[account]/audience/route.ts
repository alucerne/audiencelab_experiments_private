import { redirect } from 'next/navigation';

import { enhanceRouteHandler } from '@kit/next/routes';

import pathsConfig from '~/config/paths.config';

export const GET = enhanceRouteHandler(async ({ params }) => {
  if (!params.account) {
    redirect(pathsConfig.app.home);
  }
  redirect(pathsConfig.app.accountHome.replace('[account]', params.account));
});
