import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createWhiteLabelService } from '../white-label/white-label.service';

export const loadBrandingDetails = cache(brandingDetailsLoader);

async function brandingDetailsLoader(hostname: string) {
  const client = getSupabaseServerClient();

  const service = createWhiteLabelService(client);
  return service.getPublicBranding(hostname);
}
