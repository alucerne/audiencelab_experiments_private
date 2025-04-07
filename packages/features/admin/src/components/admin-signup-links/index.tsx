import { use } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { createAdminSignupLinksService } from '../../lib/server/services/admin-signup-links.service';
import SignupLinksTable from './table';

export default function AdminSignupLinks({ signupUrl }: { signupUrl: string }) {
  const client = getSupabaseServerAdminClient();
  const service = createAdminSignupLinksService(client);

  const signupLinks = use(service.getSignupLinks());

  return <SignupLinksTable signupLinks={signupLinks} signupUrl={signupUrl} />;
}
