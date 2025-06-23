import { use } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAdminSignupLinksService } from '../../lib/server/services/admin-signup-links.service';
import { createAdminWhiteLabelService } from '../../lib/server/services/admin-white-label.service';
import SignupLinksTable from '../admin-signup-links/table';

export default function AdminWhiteLabelSignupLinks({
  accountId,
  signupPath,
  create = true,
}: {
  accountId: string;
  signupPath: string;
  create?: boolean;
}) {
  const client = getSupabaseServerAdminClient();
  const service = createAdminSignupLinksService(client);
  const whiteLabelService = createAdminWhiteLabelService(client);

  const signupLinks = use(service.getSignupLinks(accountId));
  const branding = use(whiteLabelService.getWhiteLabelBranding(accountId));

  return (
    <SignupLinksTable
      signupLinks={signupLinks}
      signupUrl={
        branding.domain ? `https://${branding.domain}${signupPath}` : ''
      }
      create={create}
    />
  );
}
