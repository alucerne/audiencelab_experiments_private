import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createWhiteLabelService } from '~/lib/white-label/white-label.service';

export const verifyWhiteLabelBranding = cache(whiteLabelLoader);

async function whiteLabelLoader(id: string) {
  const client = getSupabaseServerClient();
  const service = createWhiteLabelService(client);

  return service.verifyWhiteLabelBranding(id);
}
