import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminWhiteLabelSignupLinks from '@kit/admin/components/admin-white-label/admin-white-label-signup-links';

import pathsConfig from '~/config/paths.config';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function AdminWhiteLabelSignupLinksPage(props: Params) {
  const params = await props.params;

  return (
    <AdminWhiteLabelSignupLinks
      accountId={params.id}
      create={false}
      signupPath={pathsConfig.auth.signUp}
    />
  );
}

export default AdminGuard(AdminWhiteLabelSignupLinksPage);
