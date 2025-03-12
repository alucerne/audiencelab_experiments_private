import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import EnrichmentUploadForm from './_components/enrichment-upload-form';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

function EnrichmentUploadPage() {
  return <EnrichmentUploadForm />;
}

export default withI18n(EnrichmentUploadPage);
