import { use } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import { createAdminWhiteLabelService } from '../../../lib/server/services/admin-white-label.service';
import AddDomainForm from './admin-add-domain-form';
import { UpdateWhiteLabelSiteIcon } from './admin-update-site-icon';
import { UpdateWhiteLabelLogo } from './admin-update-white-label-logo';
import UpdateWhiteLabelNameForm from './admin-update-white-label-name-form';

export default function AdminWhiteLabelBrandingContainer({
  accountId,
}: {
  accountId: string;
}) {
  const client = getSupabaseServerAdminClient();
  const service = createAdminWhiteLabelService(client);

  const verified = use(service.verifyWhiteLabelBranding(accountId));
  const branding = use(service.getWhiteLabelBranding(accountId));

  return (
    <div className={'flex w-full max-w-2xl flex-col space-y-4'}>
      {!verified.verified && (
        <Alert variant={'destructive'} className="bg-destructive/5">
          <AlertTitle>
            Before this account can start inviting users to their white-label,
            the following steps need to be completed:
          </AlertTitle>
          <AlertDescription>
            {verified.missing.map((step) => (
              <div key={step} className="mt-1">
                - {getMissingStep(step)}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>White-label Company Name</CardTitle>

          <CardDescription>
            Set the company name that will be used for the white-label.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UpdateWhiteLabelNameForm
            name={branding.company_name ?? ''}
            accountId={branding.account_id}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>White-label Domain</CardTitle>

          <CardDescription>
            Set the domain for your customers. This domain must be verified
            before it can be used.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AddDomainForm
            accountId={branding.account_id}
            domain={branding.domain}
            domainVerified={branding.domain_verified}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>White-label Logo</CardTitle>

          <CardDescription>Add a logo for your white-label.</CardDescription>
        </CardHeader>

        <CardContent>
          <UpdateWhiteLabelLogo
            id={branding.account_id}
            pictureUrl={branding.logo_url}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>White-label Site Icon</CardTitle>

          <CardDescription>
            Add an icon for your white-label. Choose a 48x48 PNG for best
            quality.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UpdateWhiteLabelSiteIcon
            id={branding.account_id}
            pictureUrl={branding.icon_url}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function getMissingStep(step: string) {
  switch (step) {
    case 'company_name':
      return 'Set the company name';
    case 'logo_url':
      return 'Upload a logo';
    case 'icon_url':
      return 'Upload a site icon';
    case 'domain':
      return 'Set the domain';
    case 'domain_verified':
      return 'Verify the domain';
    default:
      return step;
  }
}
