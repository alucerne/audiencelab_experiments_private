import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';

import pathsConfig from '~/config/paths.config';
import { createWhiteLabelService } from '~/lib/white-label/white-label.service';

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

  const client = getSupabaseServerClient();
  const service = createWhiteLabelService(client);

  const hostCredits = await service.getWhiteLabelCredits({
    accountId: workspace.account.id,
  });

  return (
    <>
      <div className={'space--4 flex w-full max-w-4xl flex-col px-4 pt-4'}>
        {hostCredits.restricted && <RestrictedWhiteLabelAlert />}
      </div>
      {props.children}
    </>
  );
}

function RestrictedWhiteLabelAlert() {
  return (
    <Alert variant={'destructive'} className="bg-destructive/5">
      <AlertTitle>Your white-label features have been restricted.</AlertTitle>
      <AlertDescription>
        Your clients no longer have access to any site features. Please contact
        support to restore your white-label access.
      </AlertDescription>
    </Alert>
  );
}
