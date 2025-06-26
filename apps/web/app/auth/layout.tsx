import { AuthLayoutShell } from '@kit/auth/shared';

import { DynamicLogo } from '~/components/dynamic-logo';

function AuthLayout({ children }: React.PropsWithChildren) {
  return <AuthLayoutShell Logo={DynamicLogo}>{children}</AuthLayoutShell>;
}

export default AuthLayout;
