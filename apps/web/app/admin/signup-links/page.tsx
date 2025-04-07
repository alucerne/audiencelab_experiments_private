import AdminSignupLinks from '@kit/admin/admin-signup-links';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';

export const metadata = {
  title: `Signup Links`,
};

async function AdminSignupLinksPage() {
  return (
    <>
      <PageHeader description={<AppBreadcrumbs />} title="Signup Links" />
      <PageBody>
        <AdminSignupLinks signupUrl={appConfig.url + pathsConfig.auth.signUp} />
      </PageBody>
    </>
  );
}

export default AdminGuard(AdminSignupLinksPage);
