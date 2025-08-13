import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { listSegments } from '~/lib/segments';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { TeamAccountLayoutPageHeader } from '../_components/team-account-layout-page-header';
import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import { SubSegmentsTable } from './_components/sub-segments-table';

interface SubSegmentsPageProps {
  params: Promise<{ account: string }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:subSegments.pageTitle', { defaultValue: 'Sub-segments' });

  return {
    title,
  };
};

function SubSegmentsPage({ params }: SubSegmentsPageProps) {
  const account = use(params).account;
  const workspace = use(loadTeamWorkspace(account));

  // Use file-based segments instead of database
  const segments = listSegments();

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="Sub-segments"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <SubSegmentsTable 
          segments={segments || []}
          accountId={workspace.account.id}
        />
      </PageBody>
    </>
  );
}

export default withI18n(SubSegmentsPage); 