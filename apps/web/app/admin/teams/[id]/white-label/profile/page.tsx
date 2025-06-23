import { AdminGuard } from '@kit/admin/components/admin-guard';
import AdminWhiteLabelBrandingContainer from '@kit/admin/components/admin-white-label/profile/admin-white-label-branding-container';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function AdminWhiteLabelProfilePage(props: Params) {
  const params = await props.params;

  return <AdminWhiteLabelBrandingContainer accountId={params.id} />;
}

export default AdminGuard(AdminWhiteLabelProfilePage);
