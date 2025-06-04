import { useState } from 'react';

import { Check, CopyIcon } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import GALogo from '../ga-logo';

export default function PixelInstallDialog({
  installUrl,
  children,
}: {
  installUrl: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Install Pixel</DialogTitle>
          <DialogDescription>
            Choose your installation method below.
          </DialogDescription>
        </DialogHeader>
        <PixelInstallDialogContent installUrl={installUrl} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Finish
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PixelInstallDialogContent({
  installUrl,
  note = true,
}: {
  installUrl: string;
  note?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [gaToken, setGaToken] = useState('');

  const basicScript = `<script src="${installUrl}" async></script>`;

  const gaScript = gaToken
    ? `<script src="${installUrl}" data-ga4-key="${gaToken}" async></script>`
    : `<script src="${installUrl}" data-ga4-key="YOUR_GA_TRACKING_ID" async></script>`;

  async function handleCopy(script: 'basic' | 'ga4') {
    await navigator.clipboard.writeText(
      script === 'basic' ? basicScript : gaScript,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          Basic Install
        </TabsTrigger>
        <TabsTrigger value="ga4" className="flex items-center gap-2">
          <GALogo className="size-4" />
          With Google Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold">Basic Pixel Installation</h3>
          <ul className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
            <li>
              Insert this script into the{' '}
              <code className="bg-muted rounded px-1">&lt;head&gt;</code> block
              before{' '}
              <code className="bg-muted rounded px-1">&lt;/head&gt;</code> on
              all pages.
            </li>
            <li>
              Save changes and test using browser developer tools (Network tab).
            </li>
          </ul>
        </div>
        <div className="bg-muted relative overflow-auto rounded-md border p-4">
          <pre className="font-mono text-sm break-words whitespace-pre-wrap">
            {basicScript}
          </pre>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCopy('basic')}
            className="absolute top-2 right-2 h-fit gap-2 px-2.5 py-1 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="ga4" className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold">Google Analytics Integration</h3>
          <ul className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
            <li>Enter your GA4 tracking ID in the input field below.</li>
            <li>
              Insert the generated script into the{' '}
              <code className="bg-muted rounded px-1">&lt;head&gt;</code> block
              before{' '}
              <code className="bg-muted rounded px-1">&lt;/head&gt;</code> on
              all pages.
            </li>
            <li>
              Ensure the script loads <strong>after</strong> Google Tag Manager
              (GTM) or GA4 is initialized.
            </li>
            <li>
              Save changes and test using browser developer tools (Network tab).
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ga-token">GA4 Tracking ID</Label>
          <Input
            id="ga-token"
            type="text"
            placeholder="G-XXXXXXXXXX"
            value={gaToken}
            onChange={(e) => setGaToken(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="bg-muted relative overflow-auto rounded-md border p-4">
          <pre className="font-mono text-sm break-words whitespace-pre-wrap">
            {gaScript}
          </pre>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCopy('ga4')}
            className="absolute top-2 right-2 h-fit gap-2 px-2.5 py-1 text-xs"
            disabled={!gaToken}
          >
            {copied ? (
              <>
                <Check className="size-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
        {note && !gaToken && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Remember to replace
              &quot;YOUR_GA_TRACKING_ID&quot; with your actual GA4 tracking ID
              in the script.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
