import { SetPasswordForm } from '@kit/auth/password-reset';
import { AuthLayoutShell } from '@kit/auth/shared';

import { AppLogo } from '~/components/app-logo';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const generateMetadata = {
  title: 'Set Password',
};

const Logo = () => <AppLogo href={''} />;

interface SetPasswordPageProps {
  searchParams: Promise<{
    callback?: string;
  }>;
}

async function SetPasswordPage(props: SetPasswordPageProps) {
  await requireUserInServerComponent();

  const { callback } = await props.searchParams;
  const redirectTo = callback ?? pathsConfig.app.home;

  return (
    <AuthLayoutShell Logo={Logo}>
      <SetPasswordForm redirectTo={redirectTo} />
    </AuthLayoutShell>
  );
}

export default withI18n(SetPasswordPage);
