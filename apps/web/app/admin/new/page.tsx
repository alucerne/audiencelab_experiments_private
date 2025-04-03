import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminNewTeamForm from '@kit/admin/components/admin-new-team-form';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';

export const metadata = {
  title: `Add New User`,
};

async function NewUserPage() {
  return (
    <AdminNewTeamForm
      redirectTo={appConfig.url + pathsConfig.auth.setPassword}
    />
  );
}

export default AdminGuard(NewUserPage);
