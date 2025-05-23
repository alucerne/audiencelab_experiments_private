import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { withI18n } from '~/lib/i18n/with-i18n';
import { createPixelService } from '~/lib/pixel/pixel.service';

import PixelPreview from './_components/pixel-preview';

interface PixelPreviewPageProps {
  params: Promise<{ account: string; id: string }>;
}

async function PixelPreviewPage({ params }: PixelPreviewPageProps) {
  const { id } = await params;

  const client = getSupabaseServerClient();
  const service = createPixelService(client);

  const [pixel, preview] = await Promise.all([
    service.getPixelById({ id }),
    service.getResolutionsPreview({ id }),
  ]);

  return <PixelPreview pixel={pixel} preview={preview} />;
}

export default withI18n(PixelPreviewPage);
