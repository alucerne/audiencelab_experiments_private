import { use } from 'react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import NewSyncForm from './_components/new-sync-form';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function NewSyncPage({ params }: { params: Promise<{ account: string }> }) {
  const account = use(params).account;

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account}
        title="New Audience Synchronization"
        description={<AppBreadcrumbs />}
      />

      <PageBody className="lg:px-0">
        <NewSyncForm />
      </PageBody>
    </>
  );
}

export default withI18n(NewSyncPage);
