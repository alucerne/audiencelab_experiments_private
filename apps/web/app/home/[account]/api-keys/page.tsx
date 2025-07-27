import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { PageBody } from '@kit/ui/page';

import { createApiKeysService } from '~/lib/api-keys/api-keys.service';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import ApiKeysTable from './_components/api-keys-table';
import CreateApiKeyDialog from './_components/create-api-key-dialog';

interface TeamAccountApiKeysPageProps {
  params: Promise<{ account: string }>;
}

async function TeamAccountApiKeysPage({ params }: TeamAccountApiKeysPageProps) {
  const { account } = await params;
  const {
    account: { id },
  } = await loadTeamWorkspace(account);

  const client = getSupabaseServerClient();
  const service = createApiKeysService(client);

  const apiKeys = await service.listApiKeys(id);

  return (
    <>
      <TeamAccountLayoutPageHeader
        title="API Keys"
        description={<AppBreadcrumbs />}
        account={account}
      />
      <PageBody>
        <div className={'flex w-full max-w-4xl flex-col space-y-4 pb-32'}>
          <Card>
            <CardHeader className={'flex flex-row justify-between'}>
              <div className={'flex flex-col space-y-1.5'}>
                <CardTitle>Your API Keys</CardTitle>

                <CardDescription>
                  Here you can manage your API keys. Use them to authenticate
                  requests to our public API.
                </CardDescription>
              </div>

              <CreateApiKeyDialog />
            </CardHeader>

            <CardContent>
              <ApiKeysTable apiKeys={apiKeys} />
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(TeamAccountApiKeysPage);
