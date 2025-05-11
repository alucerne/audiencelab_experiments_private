'use client';

import { IntegrationAppProvider } from '@integration-app/react';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';

import { generateIntegrationToken } from '~/lib/integration-app/server-actions';

export default function IntegrationsLayout({
  children,
}: React.PropsWithChildren) {
  const {
    account: { id, name },
  } = useTeamAccountWorkspace();

  return (
    <IntegrationAppProvider
      fetchToken={() =>
        generateIntegrationToken({
          customerId: id,
          customerName: name,
        })
      }
    >
      {children}
    </IntegrationAppProvider>
  );
}
