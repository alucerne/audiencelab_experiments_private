import { redirect } from 'next/navigation';

import pathsConfig from '~/config/paths.config';

import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';

type Params = React.PropsWithChildren<{
  params: Promise<{
    account: string;
  }>;
}>;

export default async function WhiteLabelLayout(props: Params) {
  const account = (await props.params).account;
  const workspace = await loadTeamWorkspace(account);

  if (!workspace.account.is_whitelabel_host) {
    redirect(pathsConfig.app.accountHome.replace('[account]', account));
  }

  return props.children;
}
