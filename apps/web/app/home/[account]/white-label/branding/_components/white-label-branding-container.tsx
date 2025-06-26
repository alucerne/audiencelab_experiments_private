'use client';

import { Tables } from '@kit/supabase/database';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import AddDomainForm from './add-domain-form';
import { UpdateWhiteLabelSiteIcon } from './update-site-icon';
import { UpdateWhiteLabelLogo } from './update-white-label-logo';
import UpdateWhiteLabelNameForm from './update-white-label-name-form';

export function WhiteLabelBrandingContainer({
  branding,
  verified,
}: {
  branding: Tables<'whitelabel_branding'>;
  verified:
    | {
        verified: true;
      }
    | {
        verified: false;
        missing: string[];
      };
}) {
  return (
    <div className={'flex w-full flex-col space-y-4'}>
      {!verified.verified && (
        <Alert variant={'destructive'} className="bg-destructive/5">
          <AlertTitle>
            Before you can start inviting users to your white-label, the
            following steps need to be completed:
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
          <UpdateWhiteLabelNameForm name={branding.company_name ?? ''} />
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
